# Migración a un cluster de producción

Procedimiento completo para crear un cluster de MongoDB Atlas nuevo, copiarle
los datos de la base actual y dejarlo listo para el despliegue.

Tras seguirlo, **la base actual queda como la de desarrollo** (el `DB_CONN` del
`.env` local no se toca) y **el cluster nuevo es el de producción**.

El proceso se puede repetir: es una copia puntual y unidireccional, no una
sincronización continua.

---

## 0. Antes de empezar

Comprueba que la base de origen es consistente: si tiene documentos que no
pasan la validación de su propio schema, o referencias a documentos borrados,
el clonado los arrastra o los descarta en silencio. El script avisa por
recuento (ver el paso 5), pero es más barato mirarlo antes.

Dos comprobaciones que ya han hecho falta una vez:

- Documentos con campos `required` que en realidad no están (datos anteriores
  a que el schema los exigiera). `insertMany` los descarta.
- ObjectId huérfanos en `experiencias.tecnologias` o en `hitos.experiencia`,
  apuntando a documentos que ya no existen.

---

## 1. Crear el cluster en Atlas

1. En [MongoDB Atlas](https://cloud.mongodb.com), **Create → Cluster**.
2. Un **M0 gratuito** es suficiente para este proyecto.
3. Ponle un nombre que lo distinga sin ambigüedad del de desarrollo
   (por ejemplo `cluster-prod` frente a `cluster0`).
4. Región: la misma que el cluster actual está bien.

No hace falta crear la base ni las colecciones a mano: el script las crea al
insertar el primer documento.

## 2. Database Access

**Database Access → Add New Database User**:

- Usuario **exclusivo de producción**, distinto del de desarrollo.
- Contraseña distinta de la de desarrollo. Usa _Autogenerate Secure Password_:
  evita tener que URL-encodear caracteres especiales más adelante.
- Rol: `Read and write to any database`.

## 3. Network Access

**Network Access → Add IP Address**:

- **Para el clonado:** añade tu IP actual (_Add Current IP Address_).
- **Para el despliegue en Vercel:** hará falta `0.0.0.0/0`, porque las
  funciones serverless no tienen IP fija. El acceso sigue exigiendo el usuario
  y la contraseña de producción, que son distintos de los de desarrollo.

## 4. Obtener la URI

**Connect → Drivers** y copia la cadena. Añádele el nombre de la base al final,
que Atlas no lo incluye:

```
mongodb+srv://<usuario>:<password>@<cluster>.<hash>.mongodb.net/cv_data?retryWrites=true&w=majority
```

Si la contraseña contiene `@ : / ? # [ ] %`, va **URL-encoded** dentro de la
URI. El fallo aparece al conectar, antes de escribir nada.

## 5. Clonar los datos

Desde `amm-curriculum-vitae-backend/`:

```bash
npm run clone-db -- --origen="<uri de desarrollo>" --destino="<uri de producción>"
```

Las dos conexiones van **por argumentos, nunca por el `.env`**: la dirección de
la copia queda visible en la propia orden y no depende de a qué apunte
`DB_CONN` en ese momento.

Qué copia, en este orden (los modelos referenciados antes que los que los
referencian): `Conocimiento`, `Perfil`, `Formacion`, `FormacionComplementaria`,
`Experiencia`, `Hito`. Los documentos se copian tal cual, **con su `_id`
original**, para que `Hito.experiencia` y `Experiencia.tecnologias` sigan
siendo válidas.

**`usuarios` no se copia.** El usuario de producción se crea en el paso 6.

Salida esperada:

```
Origen:  cv_data
Destino: cv_data

Conocimiento               23 -> 23
Perfil                      1 -> 1
Formacion                   2 -> 2
FormacionComplementaria     7 -> 7
Experiencia                 4 -> 4
Hito                        2 -> 2

Clonado completado. La coleccion usuarios NO se ha copiado: ejecuta `npm run seed` contra el destino.
```

> Si las dos bases se llaman igual, las dos líneas de cabecera muestran el
> mismo nombre. Distinguen por cluster, no por nombre de base.

### Casos de parada

| Situación                            | Qué hace                                                        |
| ------------------------------------ | --------------------------------------------------------------- |
| Falta `--origen` o `--destino`       | Imprime el uso y sale con 1, sin conectar                       |
| `--origen` y `--destino` iguales     | `Origen y destino son la misma conexion`, sale con 1            |
| El destino ya tiene documentos       | Enumera las colecciones no vacías y su recuento, **no escribe** |
| El recuento origen/destino no cuadra | Nombra las colecciones descuadradas y sale con 1                |
| Error de conexión o de inserción     | Imprime el error, cierra ambas conexiones y sale con 1          |

La guarda del destino existe porque el destino es producción: que un segundo
lanzamiento por descuido lo vacíe es el peor fallo posible de este script. Para
repetir el clonado sobre un destino con datos:

```bash
npm run clone-db -- --origen="<uri origen>" --destino="<uri destino>" --force
```

`--force` hace `deleteMany({})` en las seis colecciones antes de copiar.

### Si el recuento no cuadra

`insertMany` corre con `ordered: false` y descarta en silencio los documentos
que no validan contra el schema. El script lo detecta comparando recuentos y
sale con código 1. Mira qué documentos del origen incumplen el schema
(típicamente un `required` o un `enum`), arréglalos en desarrollo y vuelve a
clonar con `--force`.

## 6. Crear el usuario de producción

`npm run seed` usa `DB_CONN` del entorno. `dotenv` **no pisa** las variables ya
presentes en el proceso, así que definiéndolas en línea el `.env` no se toca en
ningún momento.

PowerShell, desde `amm-curriculum-vitae-backend/`:

```powershell
$env:DB_CONN="<uri de producción>"; $env:SEED_USER_EMAIL="<email>"; $env:SEED_USER_PASSWORD="<password de producción>"; npm run seed; Remove-Item Env:DB_CONN,Env:SEED_USER_EMAIL,Env:SEED_USER_PASSWORD
```

Bash:

```bash
DB_CONN="<uri de producción>" SEED_USER_EMAIL="<email>" SEED_USER_PASSWORD="<password de producción>" npm run seed
```

La contraseña debe ser **distinta de la de desarrollo**. Salida esperada:

```
Base de datos: cv_data
Usuario <email> creado
```

Si responde `ya existe, no se crea nada`, el usuario ya estaba creado y el
script no lo modifica. Para cambiarle la contraseña hay que borrarlo primero.

## 7. Verificar

**Recuentos e integridad referencial**, con mongosh o Compass contra el
destino:

```js
db.usuarios.countDocuments(); // 1, con password empezando por $2

// Ningún hito debe apuntar a una experiencia inexistente
const exp = db.experiencias.distinct('_id');
db.hitos.countDocuments({ experiencia: { $nin: exp } }); // 0

// Ninguna tecnología debe apuntar a un conocimiento inexistente
const con = db.conocimientos.distinct('_id');
db.experiencias.countDocuments({ tecnologias: { $nin: con } }); // 0
```

**Comparación end to end.** `GET /api/curriculum` es el contrato público real
del backend: si coincide, los datos y sus relaciones han llegado bien. Levanta
el backend contra cada base en el mismo puerto y compara la respuesta:

```bash
DB_CONN="<uri de desarrollo>" PORT=4321 node index.js &
curl -s http://localhost:4321/api/curriculum > cv-dev.json
kill %1

DB_CONN="<uri de producción>" PORT=4321 node index.js &
curl -s http://localhost:4321/api/curriculum > cv-prod.json
kill %1

diff cv-dev.json cv-prod.json   # sin salida = idénticas
```

**Login.** `POST /api/auth` contra producción debe funcionar con la contraseña
de producción y **no** con la de desarrollo.

## 8. Al terminar

- Confirma que el `.env` local sigue apuntando a la base de **desarrollo**.
- Ninguna URI de conexión debe quedar escrita en un archivo versionado. El
  `.env` está en `.gitignore`; `.env.template` solo lleva los nombres.
- Las URIs quedan en el historial de la terminal. Es la contrapartida asumida
  de pasarlas por argumentos. Si la contraseña de producción se ha expuesto en
  algún sitio que no controlas, rótala en **Database Access → Edit → Edit
  Password** y repite el paso 6 si hace falta.

---

## 9. Variables de entorno para el despliegue en Vercel

El despliegue en sí (entrypoint serverless, `vercel.json`, dominio) queda fuera
de este documento. Lo que sí hará falta, en **Project Settings → Environment
Variables**, marcadas para el entorno _Production_:

| Variable             | Valor                                                  |
| -------------------- | ------------------------------------------------------ |
| `DB_CONN`            | La URI del cluster de producción                       |
| `SECRET_JWT_SEED`    | Una semilla propia de producción, distinta de la local |
| `SEED_USER_EMAIL`    | El email del usuario de producción                     |
| `SEED_USER_PASSWORD` | La contraseña de producción                            |

`PORT` **no** se define: Vercel gestiona el puerto.

Recuerda además dejar `0.0.0.0/0` en **Network Access** del cluster (paso 3).

---

## Qué NO cubre este procedimiento

- El despliegue del backend en Vercel.
- Sincronización continua entre desarrollo y producción.
- La copia en sentido inverso (producción → desarrollo).
- Copiar la colección `usuarios`.
- Crear índices explícitamente: mongoose crea los declarados en los schemas al
  arrancar el backend contra el destino.
- Backups programados, snapshots o retención en Atlas.
