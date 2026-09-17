# amm-curriculum-vitae — backend

API REST del currículum vitae: sirve los datos del CV público y las operaciones de edición
(experiencia, conocimientos, formación, formación complementaria y perfil) con autenticación JWT.

Es el backend del monorepo; el frontend vive en `../amm-curriculum-vitae-frontend`.

## Stack

- **Node.js** + **Express 5** (los errores async llegan solos al middleware de error)
- **MongoDB** + **Mongoose 8**
- **jsonwebtoken** para el token y **bcryptjs** para el hash de la contraseña
- **cors**, **dotenv**
- **ESLint** + **Prettier**

## Requisitos

- Node.js 20 o superior
- Una base de datos MongoDB (local o Atlas)

## Instalación

```bash
npm install
cp .env.template .env   # y rellenar los valores
npm run seed            # crea el usuario del panel
npm run dev
```

## Variables de entorno

| Variable             | Para qué sirve                                           |
| -------------------- | -------------------------------------------------------- |
| `PORT`               | Puerto del servidor en local (por defecto `4000`).       |
| `DB_CONN`            | URI de conexión a MongoDB.                               |
| `SECRET_JWT_SEED`    | Semilla con la que se firman y validan los tokens.       |
| `SEED_USER_NOMBRE`   | Nombre del usuario que crea `npm run seed`.              |
| `SEED_USER_EMAIL`    | Email de ese usuario.                                    |
| `SEED_USER_PASSWORD` | Contraseña en claro de ese usuario (se guarda hasheada). |

El seed no crea nada si falta alguna de las tres `SEED_USER_*` o si el email ya existe.

## Scripts

| Script                                    | Qué hace                                                            |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `npm run dev`                             | Servidor con nodemon.                                               |
| `npm start`                               | Servidor sin recarga.                                               |
| `npm run seed`                            | Crea el usuario del panel a partir de las `SEED_USER_*`.            |
| `npm run clone-db`                        | Copia las colecciones de una base a otra (`-- --origen --destino`). |
| `npm run lint` / `npm run lint:fix`       | ESLint.                                                             |
| `npm run format` / `npm run format:check` | Prettier (escribe / solo comprueba).                                |

## Estructura

```
controllers/     un controlador por dominio; sin try/catch (los envuelve conContexto)
database/        conexión a Mongo cacheada para serverless
helpers/         HttpError, conContexto y la generación del JWT
middlewares/     validarJWT y el manejador de errores final
models/          esquemas de Mongoose
models/plugins/  toJSON compartido: quita __v/_id y añade id
routes/          un router por dominio, montado en /api/<dominio>
scripts/         seed del usuario y clonado de base de datos
docs/            notas de despliegue
docs/specs/      especificaciones de cada funcionalidad
```

## Endpoints

Todas las rutas cuelgan de `/api`. Las de escritura exigen la cabecera `x-token`.

| Método                | Ruta                       | Qué hace                                  |
| --------------------- | -------------------------- | ----------------------------------------- |
| `POST`                | `/auth`                    | Login; devuelve el token.                 |
| `GET`                 | `/auth/renew`              | Revalida el token. 🔒                     |
| `GET`                 | `/curriculum`              | Todo el CV en una sola respuesta.         |
| `GET/POST/PUT/DELETE` | `/conocimiento`            | Conocimientos (`POST /multiple` en lote). |
| `GET/POST/PUT/DELETE` | `/experiencia`             | Experiencias con sus hitos.               |
| `GET/POST/PUT/DELETE` | `/formacion`               | Formación reglada.                        |
| `GET/POST/PUT/DELETE` | `/formacionComplementaria` | Formación complementaria.                 |
| `GET/POST/PUT`        | `/perfil`                  | Perfil (documento único).                 |

## Despliegue

Preparado para Vercel: `vercel.json` reescribe todas las peticiones a `index.js`, que
exporta la app de Express sin llamar a `listen`. Los pasos de la migración a producción
están en [`docs/migracion-produccion.md`](docs/migracion-produccion.md).
