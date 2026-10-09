# SPEC 10 — Campos `linkedinURL` y `githubURL` en Perfil y retirada de `fechaNacimiento`

> **Estado:** Aprobada
> **Depende de:** SPEC 06 (`06-editar-perfil.md`, Implementada), que fija el `POST`/`PUT /api/perfil` y la normalización de `foto`; SPEC 09 (`09-tests-backend-vitest.md`), que fija `test/api/perfil.test.js` y `crearPerfilEnBd`
> **Fecha:** 2026-10-09
> **Objetivo:** Añadir al modelo `Perfil` dos campos opcionales, `linkedinURL` y `githubURL`, que `POST` y `PUT /api/perfil` guardan, validan como URL `http(s)` y borran cuando llegan vacíos, igual que hoy `foto`, y retirar del modelo y de la API el campo `fechaNacimiento`, que no se usa.

## Alcance

**Dentro:**

- **Retirada de `fechaNacimiento`**:
  - `models/Perfil.js`: se elimina el campo del schema.
  - `controllers/perfil.js`: `crearPerfil` y `actualizarPerfil` dejan de leerlo del body y de asignarlo. Si llega en el body se ignora, como cualquier campo extra.
  - `test/utils/fixtures.js` (`crearPerfilEnBd`) y `test/api/perfil.test.js` (`perfilValido` y los `toEqual`): se quita el campo.
  - Base de datos: `$unset` manual de la clave en el documento existente, en local y en producción (ver plan).
  - Ninguna respuesta (`GET /api/perfil`, `GET /api/curriculum`, `POST`, `PUT`) vuelve a incluir `fechaNacimiento`.

- `models/Perfil.js`: dos campos nuevos `linkedinURL` y `githubURL`, `String` con `trim`, **sin** `required`, con `match: /^https?:\/\//i`.
- `controllers/perfil.js`, `crearPerfil` y `actualizarPerfil`: desestructurar los dos campos del body y normalizarlos como `foto` (`valor || undefined`), de modo que `""`, `null` o ausente dejen el documento sin la clave (`POST`) o hagan `$unset` (`PUT`).
- `GET /api/perfil` y `GET /api/curriculum` devuelven los campos cuando existen, sin tocar código: salen por el `toJSON` del modelo.
- `test/api/perfil.test.js`: casos nuevos para guardar, borrar y rechazar los dos campos (ver plan).
- Un valor que no empiece por `http://` o `https://` hace fallar `save()` y responde el `500` genérico actual (`Error al crear el perfil` / `Error al actualizar el perfil`).

**Fuera de alcance (para futuras specs):**

- Validar el dominio (`linkedin.com`, `github.com`).
- Devolver `400` con mensaje por campo: los fallos de validación siguen siendo `500`, como los `required`.
- Otros enlaces (`web`, `mapsURL`, redes adicionales).
- Validar `foto` como URL.
- Migración de datos para los campos nuevos: son opcionales y el perfil de producción sigue siendo válido sin ellos.
- Script de migración versionado para el `$unset`: es una orden única de `mongosh`.
- Cambios en `routes/perfil.js`, `controllers/curriculum.js` y `scripts/clonarBBDD.js`.
- Añadir `linkedinURL` y `githubURL` a los valores por defecto de `crearPerfilEnBd`: quedan los seis campos obligatorios; los tests pasan los nuevos por parámetro.

## Modelo de datos

Campo eliminado de `PerfilSchema`: `fechaNacimiento` (`Date`, `required`). Quedan seis campos obligatorios (`nombre`, `apellidos`, `email`, `telefono`, `direccion`, `descripcion`) y tres opcionales (`foto`, `linkedinURL`, `githubURL`).

Campos nuevos en `PerfilSchema`:

```js
linkedinURL: {
  type: String,
  trim: true,
  match: /^https?:\/\//i,
},
githubURL: {
  type: String,
  trim: true,
  match: /^https?:\/\//i,
},
```

Contrato de entrada de `POST` y `PUT /api/perfil` (respecto al de la SPEC 06, se quita `fechaNacimiento` y se añaden dos claves):

```json
{
  "nombre": "Antonio",
  "apellidos": "Macián Martínez",
  "email": "antonio@example.com",
  "telefono": "600000000",
  "direccion": "Valencia",
  "descripcion": "Desarrollador frontend",
  "foto": "https://example.com/foto.jpg",
  "linkedinURL": "https://www.linkedin.com/in/usuario",
  "githubURL": "https://github.com/Anthor85"
}
```

- `linkedinURL` y `githubURL`: `""`, `null` o ausente se normalizan a `undefined`. Con valor, debe empezar por `http://` o `https://` tras el `trim`.
- La respuesta (`GET`, `201` del `POST`, `200` del `PUT`) incluye cada clave solo si el documento la tiene, como `foto`.
- `fechaNacimiento` deja de formar parte del contrato: si llega, se ignora y no se guarda.
- El resto del contrato no cambia.

### Limpieza del documento existente (mongosh)

```js
db.perfils.updateMany({}, { $unset: { fechaNacimiento: '' } });
db.perfils.countDocuments({ fechaNacimiento: { $exists: true } }); // 0
```

## Plan de implementación

1. **Retirar `fechaNacimiento`.** Quitarlo de `models/Perfil.js`, de `crearPerfil` y `actualizarPerfil`, de `crearPerfilEnBd` y de `perfilValido` y los `toEqual` de `test/api/perfil.test.js`. Añadir dos tests: `POST` y `PUT` con `fechaNacimiento` en el body responden `201`/`200`, la respuesta no trae la propiedad y el documento en la base no tiene la clave. Prueba: `npm test` en verde.
2. **Modelo.** Añadir los dos campos nuevos a `models/Perfil.js`. Prueba: `npm test` sigue en verde (los campos son opcionales).
3. **`crearPerfil`.** Desestructurar `linkedinURL` y `githubURL` y pasarlos al constructor con `|| undefined`. Prueba: `POST` con los dos campos responde `201` y los devuelve.
4. **`actualizarPerfil`.** Desestructurarlos y asignar `perfil.linkedinURL = linkedinURL || undefined` y lo mismo con `githubURL`. Prueba: `PUT` con los campos los guarda; `PUT` con `""` los elimina.
5. **Tests en `test/api/perfil.test.js`:**
   - `POST` con `linkedinURL` y `githubURL` válidos devuelve `201` y el body los incluye.
   - `POST` con los dos a `""` devuelve `201`, el body no tiene esas propiedades y en la base son `undefined`.
   - `POST` con `linkedinURL: 'javascript:alert(1)'` devuelve `500` y `Perfil.countDocuments()` es `0`.
   - `PUT` sobre un perfil sin los campos se los añade.
   - `PUT` con los dos a `""` sobre un perfil sembrado con ellos (`crearPerfilEnBd({ linkedinURL, githubURL })`) los elimina de la respuesta y de la base.
   - `PUT` con `githubURL: 'github.com/Anthor85'` (sin protocolo) devuelve `500` y el documento conserva el valor anterior.
   - `GET /api/perfil` con un perfil sembrado con los campos los devuelve.
6. `npm test` y `npm run test:coverage` completos.
7. **Limpieza en local.** Ejecutar el `$unset` en la base local. Prueba: `GET /api/perfil` y `GET /api/curriculum` no devuelven `fechaNacimiento`.
8. **Producción.** Desplegar el backend y ejecutar el mismo `$unset` en la base de producción. Prueba: las dos rutas públicas de producción no devuelven `fechaNacimiento`.

## Criterios de aceptación

- [ ] `models/Perfil.js` y `controllers/perfil.js` no contienen ninguna referencia a `fechaNacimiento`.
- [ ] `POST` y `PUT /api/perfil` sin `fechaNacimiento` responden `201` y `200`.
- [ ] `POST` y `PUT` con `fechaNacimiento` en el body lo ignoran: ni la respuesta ni el documento lo tienen.
- [ ] `GET /api/perfil` y `GET /api/curriculum` no devuelven `fechaNacimiento`, en local y en producción.
- [ ] `db.perfils.countDocuments({ fechaNacimiento: { $exists: true } })` es `0` en local y en producción.
- [ ] `POST /api/perfil` con `linkedinURL` y `githubURL` válidos responde `201` y la respuesta incluye ambos.
- [ ] `POST` sin esas claves o con `""` responde `201` y el documento se crea sin ellas.
- [ ] `PUT /api/perfil` con valores nuevos los guarda y los devuelve.
- [ ] `PUT` con `""` en un campo que tenía valor lo elimina: la respuesta ya no trae la propiedad.
- [ ] Un valor con espacios alrededor se guarda recortado.
- [ ] Un valor que no empieza por `http://` o `https://` (`javascript:…`, `github.com/x`) responde `500` y no escribe nada.
- [ ] `GET /api/perfil` y `GET /api/curriculum` devuelven los campos cuando existen y los omiten cuando no.
- [ ] Un perfil guardado antes de esta spec se sigue leyendo y actualizando sin enviar los campos nuevos.
- [ ] Los tests existentes de `perfil.test.js` pasan sin más cambio que quitar `fechaNacimiento`; los de `curriculum.test.js`, sin modificarse.
- [ ] `npm test` y `npm run test:coverage` terminan en verde con el umbral del 80%.

## Decisiones

- **Sí:** eliminar `fechaNacimiento` del modelo y de la API. No se pinta en ninguna vista y hoy viaja en el endpoint público `/api/curriculum` y en el HTML prerenderizado. **No:** conservarlo en la base y ocultarlo solo en las respuestas.
- **Sí:** `$unset` manual con `mongosh`. Es un único documento. **No:** script de migración versionado.
- **Sí:** un `fechaNacimiento` recibido se ignora en vez de rechazarse, para que el frontend anterior siga pudiendo guardar durante el despliegue.
- **Sí:** nombres `linkedinURL` y `githubURL`, fijados por el usuario.
- **Sí:** opcionales. El perfil de producción no los tiene y un `required` rompería el siguiente `PUT`.
- **Sí:** misma normalización que `foto` (`|| undefined`) en `POST` y `PUT`. Es la única forma de borrar el dato desde un formulario de reemplazo completo.
- **Sí:** `match: /^https?:\/\//i` en el schema. El valor acaba en un `href` de la página pública; el validador impide guardar un `javascript:` aunque la petición no venga del formulario. `match` no se aplica a valores vacíos, así que no choca con la normalización.
- **No:** validar el dominio. Aporta poco y obliga a mantener variantes (`www.`, `es.linkedin.com`).
- **No:** `400` con mensaje propio. Ningún controlador valida a mano; el fallo cae en el `500` de `manejarErrores`, como los `required` (SPEC 06 y 09).
- **No:** campo `mapsURL`. El enlace de la dirección se construye en el frontend a partir de `direccion` (SPEC 18 del frontend).

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Quitar el campo del schema no borra la clave del documento ya guardado, y la respuesta podría seguir exponiéndola | `$unset` en los pasos 7 y 8, con criterio de aceptación propio en local y en producción |
| Se pierde el dato de la fecha de nacimiento | Asumido: no se usa. Queda en las copias previas de la base |
| Un consumidor que haga `PUT` sin mandar los campos borra los enlaces guardados | Comportamiento buscado del reemplazo completo (igual que `foto`). El único consumidor es el formulario; desplegar el frontend de la SPEC 18 antes de rellenar los campos en producción |
| El `500` genérico no dice qué campo falla | Aceptado: el formulario valida con `type="url"` antes de enviar (SPEC 18 del frontend) |
| Una URL pegada sin protocolo se rechaza | Aceptado: el navegador ya la rechaza en el formulario con `type="url"` |
