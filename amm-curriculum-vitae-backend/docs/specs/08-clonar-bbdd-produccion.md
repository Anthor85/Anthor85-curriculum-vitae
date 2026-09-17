# SPEC 08 — Clonar la base de datos a un cluster de producción

> **Estado:** Implementada
> **Depende de:** SPEC 07 (`07-autenticacion-jwt.md`, Implementada) — el usuario de producción se crea con `npm run seed`, no se copia.
> **Fecha:** 2026-09-03
> **Objetivo:** Añadir un script `scripts/clonarBBDD.js` que copie los datos de la base actual a un cluster de Atlas nuevo preservando los `_id`, excluyendo `usuarios`, y un documento `docs/migracion-produccion.md` con el procedimiento manual completo para crear ese cluster, ejecutar la copia y configurar el despliegue.

Tras esta spec, **la base actual pasa a ser la de desarrollo** (el `DB_CONN` local no cambia) y **el cluster nuevo es el de producción**.

## Alcance

**Dentro:**

- Script nuevo `scripts/clonarBBDD.js` y script npm `"clone-db": "node scripts/clonarBBDD.js"`.
- El script recibe las dos conexiones **por argumentos de CLI**, nunca del `.env`:

  ```
  npm run clone-db -- --origen="mongodb+srv://..." --destino="mongodb+srv://..." [--force]
  ```

- Copia por **lista explícita de modelos**, en este orden (respeta las referencias):
  1. `Conocimiento`
  2. `Perfil`
  3. `Formacion`
  4. `FormacionComplementaria`
  5. `Experiencia` (sus `tecnologias` apuntan a `Conocimiento`)
  6. `Hito` (su `experiencia` apunta a `Experiencia`)
- **`Usuario` no se copia.** El usuario de producción se crea con `npm run seed` contra el destino, con una `SEED_USER_PASSWORD` propia.
- Los documentos se copian **tal cual, con su `_id` original**, para que las referencias `Hito.experiencia` y `Experiencia.tecnologias` sigan siendo válidas.
- Guarda de destino: antes de escribir nada, cuenta los documentos de las seis colecciones en destino. Si alguna tiene documentos, **aborta sin escribir** y enumera cuáles. Con `--force`, vacía esas seis colecciones y continúa.
- El script imprime, al terminar, el recuento origen vs destino de cada colección.
- Documento nuevo `docs/migracion-produccion.md` con el procedimiento manual: crear el cluster en Atlas, usuario de base de datos, Network Access, obtener la URI, ejecutar el clonado, ejecutar el seed, verificar y configurar las variables de entorno del futuro despliegue en Vercel.
- Verificación de la copia: levantar el backend contra cada base y comparar la respuesta de `GET /api/curriculum`.

**Fuera de alcance (para futuras specs):**

- El despliegue del backend en Vercel en sí (entrypoint serverless, `vercel.json`, dominio). Aquí solo se documentan las variables de entorno y los ajustes de Atlas que necesitará.
- Sincronización continua entre desarrollo y producción: esta es una copia puntual y unidireccional.
- Copiar en sentido inverso (producción → desarrollo) para refrescar el entorno local.
- Copiar la colección `usuarios`.
- Copiar índices explícitamente: mongoose los crea al arrancar el backend contra el destino.
- Backups programados, snapshots o retención en Atlas.
- Cambiar `DB_CONN` del `.env` local: sigue apuntando a la base actual, que ahora es la de desarrollo.
- Cambios en el frontend: apunta al backend por URL, no a Mongo.
- Tests automáticos del backend: no existe infraestructura de tests en este proyecto.

## Modelo de datos

No introduce estructuras nuevas. Se copian las colecciones existentes sin transformarlas.

| Modelo                    | Colección                  | Referencias que contiene                 |
| ------------------------- | -------------------------- | ---------------------------------------- |
| `Conocimiento`            | `conocimientos`            | —                                        |
| `Perfil`                  | `perfils`                  | —                                        |
| `Formacion`               | `formacions`               | —                                        |
| `FormacionComplementaria` | `formacioncomplementarias` | —                                        |
| `Experiencia`             | `experiencias`             | `tecnologias: [ObjectId → Conocimiento]` |
| `Hito`                    | `hitos`                    | `experiencia: ObjectId → Experiencia`    |
| `Usuario`                 | `usuarios`                 | **No se copia**                          |

Los nombres de colección reales los decide mongoose a partir del nombre del modelo. El script trabaja con modelos, no con nombres de colección literales, así que no depende de esta tabla.

### Contrato del script

```
node scripts/clonarBBDD.js --origen=<uri> --destino=<uri> [--force]
```

| Caso                                         | Salida | Comportamiento                                                   |
| -------------------------------------------- | ------ | ---------------------------------------------------------------- |
| Falta `--origen` o `--destino`               | 1      | Imprime el uso y no conecta                                      |
| `--origen` y `--destino` son la misma cadena | 1      | `Origen y destino son la misma conexión`, no escribe             |
| Destino con documentos y sin `--force`       | 1      | Enumera las colecciones no vacías y su recuento, no escribe nada |
| Destino con documentos y con `--force`       | 0      | `deleteMany({})` en las seis colecciones y copia                 |
| Destino vacío                                | 0      | Copia e imprime el recuento por colección                        |
| Error de conexión o de inserción             | 1      | Imprime el error y cierra ambas conexiones                       |

Salida esperada de una ejecución correcta:

```
Origen:  <nombre de la base de origen>
Destino: <nombre de la base de destino>
Conocimiento              42 -> 42
Perfil                     1 -> 1
Formacion                  3 -> 3
FormacionComplementaria    7 -> 7
Experiencia                5 -> 5
Hito                      18 -> 18
Clonado completado. La coleccion usuarios NO se ha copiado: ejecuta `npm run seed` contra el destino.
```

### Cómo se conecta a dos bases a la vez

Los modelos de `models/` están compilados sobre la conexión por defecto de mongoose, así que el script **no los usa directamente**: toma su `.schema` y lo recompila sobre dos conexiones independientes creadas con `mongoose.createConnection`.

```js
const origen = await mongoose.createConnection(uriOrigen).asPromise();
const destino = await mongoose.createConnection(uriDestino).asPromise();

const ExperienciaOrigen = origen.model('Experiencia', require('../models/Experiencia').schema);
const ExperienciaDestino = destino.model('Experiencia', require('../models/Experiencia').schema);
```

La lectura es `find().lean()` (devuelve el documento crudo, con `_id` y `__v`) y la escritura `insertMany(docs, { ordered: false })`.

## Plan de implementación

1. Crear `scripts/clonarBBDD.js` con solo el parseo de argumentos y las validaciones: uso si falta alguno, error si coinciden. Añadir `"clone-db"` a `package.json`. Prueba: `npm run clone-db` sin argumentos imprime el uso y sale con código distinto de 0; con `--origen` y `--destino` iguales, avisa y sale.
2. Añadir la apertura de las dos conexiones con `createConnection`, imprimir el nombre de cada base y cerrarlas. Prueba: ejecutado con la base actual como origen y el cluster nuevo vacío como destino, imprime los dos nombres y termina sin error.
3. Añadir la lista explícita de los seis modelos y la guarda de destino: `countDocuments()` en cada colección destino, abortar enumerando las no vacías salvo que venga `--force`. Prueba: contra un destino vacío no aborta; tras insertar un documento a mano en destino, aborta y lo enumera.
4. Añadir el `deleteMany({})` de las seis colecciones cuando venga `--force`. Prueba: con un documento suelto en destino, `--force` lo borra y continúa.
5. Añadir la copia: por cada modelo en orden, `find().lean()` en origen e `insertMany` en destino, saltando la inserción si el origen no tiene documentos. Imprimir el recuento origen vs destino por colección. Prueba: `npm run clone-db -- --origen=... --destino=...` deja los mismos recuentos en las seis colecciones y `usuarios` vacía en destino.
6. Comprobar la integridad referencial en el destino con mongosh o Compass: todo `hitos.experiencia` existe en `experiencias`, y todos los ObjectId de `experiencias.tecnologias` existen en `conocimientos`.
7. Ejecutar `npm run seed` con `DB_CONN` apuntando temporalmente al destino y una `SEED_USER_PASSWORD` distinta de la de desarrollo. Devolver `DB_CONN` a la base de desarrollo al terminar. Prueba: `db.usuarios.countDocuments()` en destino es 1 y el `password` empieza por `$2`.
8. Verificación end to end: arrancar el backend contra la base de desarrollo y guardar la respuesta de `GET /api/curriculum`; arrancarlo contra el destino y guardar la misma respuesta; ambas son idénticas.
9. Escribir `docs/migracion-produccion.md` con todo el procedimiento anterior más la sección de configuración de Vercel. Prueba: siguiendo solo ese documento, sin leer la spec, se puede repetir el proceso desde cero.
10. `npm run lint` y `npm run format:check` sin errores nuevos.

## Procedimiento manual

Resumen; el detalle paso a paso va en `docs/migracion-produccion.md`.

1. **Crear el cluster** en MongoDB Atlas (un M0 gratuito sirve), con un nombre que lo distinga claramente del actual.
2. **Database Access:** crear un usuario de base de datos exclusivo de producción, con contraseña distinta de la de desarrollo y rol `readWrite` sobre la base nueva.
3. **Network Access:** durante el clonado, permitir tu IP actual. Para el despliegue en Vercel hará falta `0.0.0.0/0`, porque las funciones serverless no tienen IP fija.
4. **Obtener la URI** de conexión (`mongodb+srv://usuario:password@cluster/nombreBase?retryWrites=true&w=majority`). Si la contraseña tiene caracteres especiales, van URL-encoded.
5. **Clonar:** `npm run clone-db -- --origen="<uri actual>" --destino="<uri nueva>"`.
6. **Seed** del usuario de producción (paso 7 del plan de implementación).
7. **Verificar** comparando `GET /api/curriculum` contra las dos bases.
8. **Cuando se despliegue en Vercel:** definir en el proyecto las variables de entorno `DB_CONN` (la URI nueva), `SECRET_JWT_SEED`, `SEED_USER_EMAIL` y `SEED_USER_PASSWORD`, marcadas para el entorno _Production_. `PORT` no se define: Vercel gestiona el puerto.

## Criterios de aceptación

- [ ] `npm run clone-db` sin `--origen` o sin `--destino` imprime el uso, no conecta y sale con código distinto de 0.
- [ ] Con `--origen` y `--destino` iguales, el script avisa y no escribe nada.
- [ ] Con el destino no vacío y sin `--force`, el script enumera las colecciones con documentos y **no modifica el destino**.
- [ ] Con `--force`, el script vacía las seis colecciones del destino antes de copiar.
- [ ] Tras el clonado, el recuento de documentos de `Conocimiento`, `Perfil`, `Formacion`, `FormacionComplementaria`, `Experiencia` e `Hito` coincide entre origen y destino.
- [ ] Los `_id` de los documentos del destino son los mismos que los del origen.
- [ ] Todo `hitos.experiencia` del destino apunta a un documento existente en `experiencias` del destino.
- [ ] Todo ObjectId de `experiencias.tecnologias` del destino existe en `conocimientos` del destino.
- [ ] La colección `usuarios` del destino está vacía inmediatamente después del clonado.
- [ ] Tras `npm run seed` contra el destino, `usuarios` tiene exactamente 1 documento con `password` hasheado.
- [ ] La respuesta de `GET /api/curriculum` con el backend apuntando al destino es idéntica a la del backend apuntando al origen.
- [ ] `POST /api/auth` contra el destino funciona con la contraseña de producción y **no** con la de desarrollo.
- [ ] Ninguna URI de conexión queda escrita en un archivo versionado.
- [ ] El `.env` local sigue apuntando a la base de desarrollo al terminar el proceso.
- [ ] `docs/migracion-produccion.md` existe y permite repetir el proceso sin consultar la spec.
- [ ] `npm run lint` y `npm run format:check` terminan sin errores nuevos.

## Decisiones

- **Sí:** la base actual se queda como desarrollo y la nueva es producción. Evita mover los datos reales a un sitio nuevo y luego repuntar lo que ya funciona; el `.env` local no se toca.
- **Sí:** script Node con mongoose en vez de `mongodump`/`mongorestore`. No hay que instalar las MongoDB Database Tools, el script queda versionado y reutilizable, y las seis colecciones están todas cubiertas por modelos existentes.
- **No:** función nativa de clonado de Atlas. En clusters M0 el snapshot/restore está limitado, y ata el procedimiento a la interfaz web en vez de dejarlo en el repositorio.
- **Sí:** conexiones por argumentos de CLI y no por variables de entorno. La dirección de la copia queda visible en la propia orden y no depende de a qué apunte `DB_CONN` en ese momento, que es justo el error caro aquí. Contrapartida asumida: las URIs quedan en el historial de la terminal.
- **Sí:** abortar si el destino tiene datos, con `--force` como escape explícito. El destino es producción; que un segundo lanzamiento por descuido lo vacíe es el peor fallo posible de este script.
- **Sí:** lista explícita de modelos en vez de recorrer `models/` automáticamente. Controla exactamente qué llega a producción y hace imposible que un modelo nuevo se copie sin que alguien lo decida. Contrapartida: al añadir un modelo hay que tocar el script.
- **Sí:** orden de copia con `Conocimiento` y `Experiencia` antes que sus referenciadores. Mongoose no valida las referencias en `insertMany`, pero el orden deja el destino consistente en todo momento por si la ejecución se corta a medias.
- **Sí:** preservar los `_id`. `Hito.experiencia` y `Experiencia.tecnologias` son ObjectIds; regenerarlos rompería todas las relaciones.
- **Sí:** `find().lean()` + `insertMany`. `lean()` devuelve el documento crudo, sin pasar por el `toJSON` del modelo, así que `_id` y `__v` llegan intactos y no se aplica ninguna transformación.
- **Sí:** `usuarios` fuera de la copia y usuario de producción por `npm run seed`. Los hashes de la base actual no se propagan y la contraseña de producción puede ser distinta desde el primer día.
- **No:** copiar índices explícitamente. Mongoose crea los índices declarados en los schemas (el `unique` de `Perfil.email`, el de `Usuario.email`) al arrancar el backend contra el destino.
- **Sí:** verificación por comparación de `GET /api/curriculum`. Es el contrato público real del backend; si coincide, los datos y sus relaciones han llegado bien.
- **No:** sincronización continua entre las dos bases. Una copia puntual cubre el caso; una réplica viva exige change streams o un replica set y no aporta nada a un CV personal.
- **Sí:** instrucciones en `docs/migracion-produccion.md` y no dentro de la spec. El proceso se va a repetir o consultar fuera del contexto de esta spec, y la spec se archiva como Implementada.

## Riesgos

| Riesgo                                                                                | Mitigación                                                                                                                                        |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invertir origen y destino y sobrescribir la base con los datos buenos                 | El script imprime el nombre de las dos bases antes de escribir, aborta si el destino tiene documentos y exige `--force` para borrar                 |
| El paso 7 exige apuntar `DB_CONN` a producción temporalmente y olvidarse de devolverlo | Está como paso numerado con su vuelta atrás explícita y como criterio de aceptación                                                                |
| La contraseña de la URI con caracteres especiales rompe la conexión                    | El documento recuerda URL-encodearla; el fallo aparece al conectar, antes de escribir nada                                                          |
| `insertMany` con un lote grande supera el límite de 16 MB por operación                | El volumen actual son decenas de documentos por colección. Si creciera, insertar por lotes                                                          |
| `--force` ejecutado contra un producción ya en uso                                    | Solo se usa para repetir el clonado inicial; el mensaje del abort dice explícitamente qué colecciones borraría y con cuántos documentos             |
| Abrir Network Access a `0.0.0.0/0` para Vercel expone el cluster a cualquier IP        | El acceso sigue exigiendo el usuario y la contraseña propios de producción, distintos de los de desarrollo                                          |
| El backend Express no funciona tal cual en Vercel (necesita entrypoint serverless)     | Fuera del alcance de esta spec: aquí solo se documentan las variables de entorno y los ajustes de Atlas. El despliegue en sí es una spec aparte      |
| Se añade un modelo nuevo más adelante y el script no lo copia                          | Consecuencia asumida de la lista explícita; el recuento final por colección solo muestra las seis declaradas, así que la ausencia se ve al ejecutar |
