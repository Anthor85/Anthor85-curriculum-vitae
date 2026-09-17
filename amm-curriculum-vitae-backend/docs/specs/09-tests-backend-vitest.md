# SPEC 09 — Tests de integración del backend con Vitest y supertest

> **Estado:** Aprobada
> **Depende de:** SPEC 07 (`07-autenticacion-jwt.md`, Implementada), que fija el login, `validarJWT` y la cabecera `x-token`; SPEC 01 (`01-hitos-experiencia.md`, Implementada) y SPEC 02 (`02-editar-experiencia.md`, Implementada), que fijan la reconciliación de hitos de `PUT /api/experiencia/:id`; SPEC 03, 04, 05 y 06 (Implementadas), que fijan el CRUD de conocimiento, formación, formación complementaria y perfil
> **Fecha:** 2026-09-17
> **Objetivo:** Montar Vitest, supertest y `mongodb-memory-server` en el backend y escribir siete archivos de test de integración HTTP (uno por router) que pidan las rutas reales de la app de `index.js` contra una MongoDB efímera, cubriendo el camino feliz, los 401 sin token y los 404 de cada endpoint.

## Alcance

**Dentro:**

- Instalar como `devDependencies`: `vitest`, `@vitest/coverage-v8`, `supertest` y `mongodb-memory-server`.
- `vitest.config.js` nuevo en la raíz del backend (no hay `vite.config.js` que ampliar): `environment: 'node'`, `globals: true`, `globalSetup: './test/globalSetup.js'`, `setupFiles: './test/setup.js'` e `include: ['test/**/*.test.js']`.
- Bloque `coverage` con `provider: 'v8'`, `reporter: ['text', 'html']`, `include` de `controllers/**`, `middlewares/**`, `helpers/**`, `models/**` y `database/config.js`, y `thresholds` al 80% en `lines`, `statements`, `functions` y `branches` (mismo umbral que el frontend en SPEC 12/13).
- Scripts nuevos en `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"` y `"test:coverage": "vitest run --coverage"`.
- `test/globalSetup.js`: arranca **un único** `MongoMemoryServer` para toda la ejecución, publica su URI en `process.env.MONGO_TEST_URI` y lo para en el teardown.
- `test/setup.js`, que corre en cada worker:
  - Fija `process.env.SECRET_JWT_SEED` a un valor de test fijo y `process.env.DB_CONN` a `${MONGO_TEST_URI}vitest_<worker>`, **una base de datos propia por worker**, para que los archivos puedan correr en paralelo sin pisarse el `afterEach`.
  - `beforeAll`: llama a `dbConnection()` de `database/config.js` (el código real, no un mock) para que la promesa cacheada en `global._mongooseConn` quede apuntando a la base efímera y el middleware de `index.js` no abra otra conexión.
  - `afterEach`: vacía **todas** las colecciones de la conexión (`mongoose.connection.db.collections()` + `deleteMany({})`).
  - `afterAll`: `mongoose.disconnect()` y `global._mongooseConn = undefined`.
- La app se importa tal cual con `require('../index')` y `supertest` la envuelve sin llamar a `listen` (el `require.main === module` de `index.js` ya evita el `listen` al importarla). El código de producción no se toca, **con una única excepción acordada durante la implementación**: `controllers/auth.js` desestructura `req.body ?? {}` en `login`. En Express 5 `req.body` es `undefined` cuando la petición no trae cuerpo (en Express 4 era `{}`), así que el `POST /api/auth` sin body acababa en un `500` por `TypeError` en vez del `400` que describe el caso 4 de `auth.test.js`.
- `test/utils/token.js`: helper `tokenValido(uid, nombre)` que firma un JWT real con `generarJWT` del propio `helpers/jwt.js`, y `tokenCaducado()` / `tokenDeOtraSemilla()` para los casos de 401. El token viaja siempre en la cabecera `x-token`.
- `test/utils/fixtures.js`: factorías que siembran documentos directamente con los modelos de Mongoose (`crearConocimientoEnBd`, `crearExperienciaEnBd`, `crearFormacionEnBd`, `crearFormacionComplementariaEnBd`, `crearPerfilEnBd`, `crearUsuarioEnBd` con la contraseña ya hasheada con `bcryptjs`).
- Siete archivos en `test/api/`: `auth.test.js`, `curriculum.test.js`, `conocimiento.test.js`, `experiencia.test.js`, `formacion.test.js`, `formacionComplementaria.test.js` y `perfil.test.js`. Ver la matriz de casos en "Modelo de datos".
- Se ejercita de verdad toda la pila: router → `validarJWT` → controlador → `conContexto` → modelo Mongoose (con sus validaciones y el plugin `toJSON`) → `manejarErrores`.

**Fuera de alcance (para futuras specs):**

- Tests unitarios aislados de `helpers/jwt.js`, `helpers/HttpError.js`, `helpers/conContexto.js`, `middlewares/manejarErrores.js` y `models/plugins/toJSON.js`: aquí se cubren de rebote a través de las rutas.
- Tests de los scripts `scripts/seedUsuario.js` y `scripts/clonarBBDD.js` (SPEC 08).
- Tests del arranque en Vercel (`vercel.json`) y del comportamiento serverless de la caché de conexión.
- Tests de rendimiento, de carga y de concurrencia.
- Tests E2E que combinen frontend y backend.
- Integración en CI: los tests se lanzan a mano con `npm test`, igual que en el frontend.
- Añadir validación de entrada (`express-validator` o equivalente) al backend. Los tests describen el comportamiento **actual**: hoy un body inválido cae en el `500` que fabrica `manejarErrores` con el mensaje de `conContexto`, y así se asserta.
- Cambiar códigos de estado o mensajes existentes para "que queden más correctos". Si un test revela algo discutible, se anota, no se arregla en esta spec.
- Mocks de Mongoose o de los modelos: todo va contra la base en memoria.

## Modelo de datos

Esta funcionalidad no introduce estructuras de datos de producción ni modifica los esquemas. Solo añade fixtures de test, que reutilizan los modelos existentes (`Usuario`, `Perfil`, `Conocimiento`, `Experiencia`, `Hito`, `Formacion`, `FormacionComplementaria`).

Fixtures base compartidos (`test/utils/fixtures.js`):

| Factoría                               | Valores por defecto                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `crearUsuarioEnBd`                     | `nombre: 'Antonio'`, `email: 'test@test.com'`, `password: '123456'` hasheada con `bcrypt.hashSync` |
| `crearConocimientoEnBd`                | `titulo: 'React'`, `nivel: 'Avanzado'`                                                             |
| `crearExperienciaEnBd`                 | `empresa`, `descripcion`, `fechaInicio: '2020-01-01'`, `fechaFin: null`, `tecnologias: []`          |
| `crearFormacionEnBd`                   | `titulo`, `institucion`, `fechaFin: '2015-06-30'`                                                  |
| `crearFormacionComplementariaEnBd`     | `titulo`, `institucion`                                                                            |
| `crearPerfilEnBd`                      | los siete campos obligatorios de `PerfilSchema`                                                    |

### `auth.test.js` (8 tests)

1. `POST /api/auth` con email y contraseña correctos devuelve `200` con `uid`, `nombre`, `email` y `token`, y el token verifica con `SECRET_JWT_SEED`.
2. `POST /api/auth` con email inexistente devuelve `400` y `{ msg: 'Credenciales incorrectas' }`.
3. `POST /api/auth` con contraseña incorrecta devuelve `400` y el mismo mensaje (no se distingue el motivo).
4. `POST /api/auth` sin body devuelve `400` y `Credenciales incorrectas`.
5. La respuesta del login **no** incluye `password` (lo omite el plugin `toJSON`) ni `_id` ni `__v`.
6. `GET /api/auth/renew` con un token válido de un usuario existente devuelve `200`, los mismos datos y un token nuevo.
7. `GET /api/auth/renew` sin cabecera `x-token` devuelve `401` y `{ msg: 'No hay token en la petición' }`.
8. `GET /api/auth/renew` con un token firmado con otra semilla devuelve `401` y `{ msg: 'Token no válido' }`.

### `conocimiento.test.js` (10 tests)

1. `GET /api/conocimiento` con la base vacía devuelve `200` y `[]`.
2. `GET /api/conocimiento` devuelve los conocimientos sembrados, cada uno con `id` y sin `_id` ni `__v`.
3. `POST /api/conocimiento` con token devuelve `201`, el documento creado, y queda uno en la base.
4. `POST /api/conocimiento` sin token devuelve `401` y no crea nada.
5. `POST /api/conocimiento` con `nivel` fuera del `enum` devuelve `500` con `{ msg: 'Error al crear el conocimiento' }` y no crea nada.
6. `POST /api/conocimiento/multiple` con token y un array de dos devuelve `201` y deja dos en la base.
7. `PUT /api/conocimiento/:id` con token actualiza `titulo` y `nivel` y devuelve el documento actualizado.
8. `PUT /api/conocimiento/:id` con un id inexistente devuelve `404` y `{ msg: 'Conocimiento no encontrado' }`.
9. `DELETE /api/conocimiento/:id` con token devuelve `200` con `{ msg: 'Conocimiento eliminado', id }` y lo borra de la base.
10. `DELETE /api/conocimiento/:id` sin token devuelve `401` y el documento sigue en la base.

### `experiencia.test.js` (12 tests)

1. `GET /api/experiencia` con la base vacía devuelve `200` y `[]`.
2. `GET /api/experiencia` devuelve las experiencias con sus `hitos` poblados (array de `{ id, descripcion }`).
3. `POST /api/experiencia` con token y sin hitos devuelve `201` con `hitos: []`.
4. `POST /api/experiencia` con `hitos` como array de cadenas crea un `Hito` por cada una, todos apuntando a la experiencia nueva.
5. `POST /api/experiencia` con `hitos` como array de objetos `{ id, descripcion }` **ignora los `id` recibidos** y crea hitos nuevos.
6. `POST /api/experiencia` descarta las descripciones de hito vacías o de solo espacios.
7. `POST /api/experiencia` con `tecnologias` como cadena `"idA,idB"` la parte en dos `ObjectId`; con `tecnologias: ''` guarda `[]`.
8. `POST /api/experiencia` con `fechaFin: ''` guarda `null`.
9. `POST /api/experiencia` sin token devuelve `401`.
10. `PUT /api/experiencia/:id` reconcilia los hitos: conserva el `_id` del hito cuyo `id` se reenvía, crea el que llega sin `id` y borra el que ya no viene en el body.
11. `PUT /api/experiencia/:id` con un `id` de hito que no pertenece a esa experiencia lo descarta y crea un hito nuevo (no lo reasigna).
12. `DELETE /api/experiencia/:id` devuelve `{ msg, experiencia, hitosEliminados }`, borra en cascada sus hitos y no toca los de otra experiencia. Con un id inexistente devuelve `404` y `{ msg: 'Experiencia no encontrada' }`.

### `formacion.test.js` (8 tests)

1. `GET /api/formacion` con la base vacía devuelve `200` y `[]`.
2. `GET /api/formacion` devuelve las formaciones sembradas con `id` y sin `_id` ni `__v`.
3. `POST /api/formacion` con token devuelve `201` y deja el documento en la base.
4. `POST /api/formacion` sin token devuelve `401` y no crea nada.
5. `POST /api/formacion` sin `fechaFin` (campo obligatorio) devuelve `500` con el mensaje de contexto del controlador.
6. `PUT /api/formacion/:id` con token actualiza los campos y devuelve el documento actualizado.
7. `PUT /api/formacion/:id` con un id inexistente devuelve `404`.
8. `DELETE /api/formacion/:id` con token borra el documento; sin token devuelve `401` y no lo borra.

### `formacionComplementaria.test.js` (8 tests)

Los mismos ocho casos de `formacion.test.js` contra `/api/formacionComplementaria`, con dos diferencias: el campo obligatorio que se deja vacío en el test 5 es `institucion` (aquí `fechaFin` es opcional) y los mensajes de error son los del controlador de formación complementaria.

### `perfil.test.js` (8 tests)

1. `GET /api/perfil` sin perfil en la base devuelve `404` y `{ msg: 'Perfil no encontrado' }`.
2. `GET /api/perfil` con un perfil sembrado lo devuelve con `id` y sin `_id` ni `__v`.
3. `POST /api/perfil` con token devuelve `201` y deja el perfil en la base.
4. `POST /api/perfil` con `foto: ''` guarda el perfil sin el campo `foto`.
5. `POST /api/perfil` sin token devuelve `401`.
6. `PUT /api/perfil` (sin `:id`, actúa sobre el único perfil) con token lo actualiza y devuelve el resultado.
7. `PUT /api/perfil` sin perfil en la base devuelve `404`.
8. `PUT /api/perfil` sin token devuelve `401` y el perfil no cambia.

### `curriculum.test.js` (4 tests)

1. `GET /api/curriculum` con la base vacía devuelve `200` con las cinco claves: `conocimiento: []`, `experiencia: []`, `formaciones: []`, `formacionesComplementarias: []` y `perfil: null`.
2. `GET /api/curriculum` con datos de los cinco tipos los devuelve todos agrupados en sus claves.
3. Las experiencias del curriculum llegan con sus `hitos` poblados.
4. `GET /api/curriculum` es público: responde `200` sin cabecera `x-token`.

Total: **58 tests** en siete archivos.

## Plan de implementación

1. Instalar las cuatro devDependencies y añadir los tres scripts a `package.json`. Comprobación: `npx vitest --version` responde.
2. Crear `test/globalSetup.js` (arranque y parada del `MongoMemoryServer`) y `test/setup.js` (variables de entorno, `dbConnection()`, limpieza en `afterEach`, desconexión en `afterAll`), más `vitest.config.js` con `environment`, `globalSetup`, `setupFiles` e `include` (sin el bloque `coverage` todavía). Comprobación: un test temporal que pida `GET /api/conocimiento` y espere `200` con `[]` pasa en verde.
3. Crear `test/utils/token.js` y `test/utils/fixtures.js`.
4. Escribir `test/api/conocimiento.test.js` completo. Es el recurso más simple y fija el patrón: `supertest(app)`, cabecera `x-token`, siembra con fixtures y asserts sobre el body y sobre la base. Comprobación: `npm test -- conocimiento` pasa en verde y el test temporal del paso 2 se borra.
5. Escribir `test/api/auth.test.js`, que cierra el login, el renew y los dos mensajes de 401.
6. Escribir `test/api/formacion.test.js` y `test/api/formacionComplementaria.test.js` siguiendo el patrón del paso 4.
7. Escribir `test/api/perfil.test.js`.
8. Escribir `test/api/experiencia.test.js`, el más largo: normalización de tecnologías y hitos, reconciliación en el `PUT` y cascada en el `DELETE`.
9. Escribir `test/api/curriculum.test.js`.
10. Añadir el bloque `coverage` al `vitest.config.js` con el `include` y los umbrales del 80%, y ejecutar `npm run test:coverage`. Si algún archivo incluido baja del umbral, se añaden los tests que falten a su archivo correspondiente (no se baja el umbral).
11. Documentar en el `README.md` del backend la sección de tests: los tres scripts, que la base es efímera y que no hace falta `.env` para ejecutarlos.

## Criterios de aceptación

- [ ] `npm test` ejecuta los siete archivos de `test/api/` y termina con 58 tests en verde, sin `.env` presente y sin conexión a Atlas.
- [ ] `npm test` ejecutado dos veces seguidas da el mismo resultado: ninguna colección sobrevive entre tests.
- [ ] Ningún test importa un modelo mockeado: todos escriben y leen contra la MongoDB en memoria.
- [ ] `index.js`, `routes/`, `models/`, `middlewares/`, `helpers/` y `database/config.js` no tienen ni un cambio respecto a antes de la spec. El único cambio de producción permitido es el `req.body ?? {}` de `controllers/auth.js`, así que `git diff` solo muestra `package.json`, `README.md`, `vitest.config.js`, `controllers/auth.js` y `test/`.
- [ ] Toda ruta protegida por `validarJWT` tiene al menos un test que la pide sin cabecera `x-token` y espera `401`.
- [ ] Todo controlador que lanza `HttpError(404, ...)` tiene un test que lo provoca y asserta el `msg` exacto.
- [ ] Los asserts de los `GET` comprueban que los documentos traen `id` y no traen `_id` ni `__v`, y el del login que no trae `password`.
- [ ] `npm run test:coverage` termina en verde con los umbrales del 80% en `lines`, `statements`, `functions` y `branches`.
- [ ] `npm run lint` y `npm run format:check` pasan sobre los archivos nuevos.
- [ ] El `README.md` del backend documenta `npm test`, `npm run test:watch` y `npm run test:coverage`.

## Decisiones tomadas y descartadas

- **Vitest, no Jest.** El frontend ya usa Vitest (SPEC 12 y 13); un solo runner en el monorepo significa un solo vocabulario (`vi.mock`, `describe/it`, `expect`) y una sola forma de leer la cobertura. Jest habría dado más ejemplos de Express a copiar, pero introducía un segundo runner. `node:test` se descartó por ergonomía y por la cobertura más pobre.
- **`mongodb-memory-server`, no mocks de Mongoose.** Mockear los modelos habría dejado sin testear lo que más se rompe: las validaciones del esquema, el `enum` de `nivel`, el `populate('hitos')` y el plugin `toJSON`. El coste es una descarga de binario la primera vez, que se paga una sola vez por máquina. La base de desarrollo real se descartó por reproducibilidad: los tests borran colecciones.
- **Integración HTTP con supertest, no unitarios de controladores.** Llamar al controlador con un `req`/`res` falsos deja fuera el routing, `validarJWT` y `manejarErrores`, que es precisamente donde están los `401`, los `404` y el `500` con contexto. Los helpers quedan cubiertos de rebote.
- **La conexión se enchufa por `process.env.DB_CONN`, sin tocar `database/config.js`.** El setup asigna la URI de la base efímera y llama al `dbConnection()` real, así que el código de producción se ejecuta tal cual y también cuenta para la cobertura. Se descartó mockear `database/config` (habría dejado ese archivo sin cubrir) y refactorizarlo para aceptar una URI por parámetro (tocar producción dentro de una spec de tests).
- **Token real firmado con `generarJWT`, no mock de `validarJWT`.** Con el token real se testean los tres caminos del middleware (sin token, token de otra semilla, token válido) sin escribir un solo test extra.
- **Una base de datos por worker y limpieza en `afterEach`.** Cada test siembra lo suyo y no depende del orden ni de lo que haga otro archivo en paralelo. La alternativa (sembrar en `beforeAll`, limpiar en `afterAll`) es más rápida pero acopla los tests de un mismo archivo entre sí.
- **Los siete recursos en una sola spec.** Cinco de los siete archivos son el mismo CRUD con otros nombres; partirlos en dos specs habría duplicado la sección de infraestructura sin ganar nada.
- **Umbral del 80%, igual que el frontend.** Mismo listón en los dos proyectos para que "cobertura suficiente" signifique lo mismo en todo el repo.
- **Los tests describen el comportamiento actual, no el deseado.** Hoy un body inválido acaba en un `500` con el mensaje de `conContexto` porque no hay capa de validación. Se asserta ese `500`. Añadir `express-validator` y convertirlo en `400` es otra spec.

## Riesgos identificados

- **Descarga del binario de MongoDB.** La primera ejecución de `mongodb-memory-server` descarga un `mongod` (~100 MB). En una máquina sin red o detrás de un proxy, `npm test` falla con un error de descarga, no de test. Mitigación: documentarlo en el `README.md` y, si aparece, fijar `MONGOMS_DOWNLOAD_MIRROR` o una versión concreta con `MONGOMS_VERSION`.
- **Caché de conexión global.** `database/config.js` cachea la promesa en `global._mongooseConn`. Si el `afterAll` no la resetea, un segundo archivo en el mismo worker reutilizaría una conexión ya cerrada y los tests fallarían con `MongoNotConnectedError`. Mitigación: el reset está en el `afterAll` del setup y es un criterio de aceptación implícito del test de doble ejecución.
- **Umbral del 80% con `models/` incluido.** Los esquemas son casi todo declaración; la cobertura real la aportan `plugins/toJSON.js` y los controladores. Si el umbral no se alcanza al llegar al paso 10, la salida es añadir tests (por ejemplo, el `normalizar` del plugin con fechas y `ObjectId` anidados), no recortar el `include`.
- **Fechas y zona horaria.** Los campos `Date` se serializan en ISO con `Z`. Comparar contra la cadena que se mandó (`'2020-01-01'`) falla. Mitigación: los asserts de fechas comparan `new Date(body.fechaInicio).toISOString()` contra un valor esperado explícito.
