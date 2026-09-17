# SPEC 07 — Autenticación con JWT y protección de la escritura

> **Estado:** Implementada
> **Depende de:** SPEC 06 (`06-editar-perfil.md`, Implementada) — solo como precedente de patrón de controlador, no hay dependencia técnica. La consume la SPEC 14 del frontend (`14-login-rutas-protegidas.md`).
> **Fecha:** 2026-09-02
> **Objetivo:** Añadir un modelo `Usuario`, los endpoints `POST /api/auth` y `GET /api/auth/renew` con JWT firmado con `SECRET_JWT_SEED`, un middleware `validarJWT` aplicado a todos los `POST`/`PUT`/`DELETE` existentes, y un script de seed idempotente que cree el usuario `ammlink@hotmail.com`.

## Alcance

**Dentro:**

- Dependencias nuevas en `package.json`: `bcryptjs` y `jsonwebtoken`.
- Modelo nuevo `models/Usuario.js`: `email` (`String`, `required`, `trim`, `unique`), `password` (`String`, `required`) y `nombre` (`String`, `required`, `trim`). `toJSON` que expone `id`, oculta `_id`, `__v` **y `password`**.
- Helper nuevo `helpers/jwt.js` con `generarJWT(uid, nombre)`, que firma con `process.env.SECRET_JWT_SEED` y `expiresIn: '30d'` y devuelve una promesa.
- Controlador nuevo `controllers/auth.js` con `login` y `revalidarToken`.
- Ruta nueva `routes/auth.js` montada en `index.js` como `app.use('/api/auth', require('./routes/auth'))`, **antes** del resto de rutas:
  - `POST /api/auth` → `login` (público).
  - `GET /api/auth/renew` → `validarJWT` + `revalidarToken`.
- Middleware nuevo `middlewares/validarJWT.js`: lee el header `x-token`, verifica con `jwt.verify` y deja `req.uid` y `req.nombre` en la petición.
- Aplicar `validarJWT` a **todas las rutas de escritura existentes**, ruta a ruta (no global):
  - `routes/experiencia.js`: `post('/')`, `put('/:id')`, `delete('/:id')`.
  - `routes/conocimiento.js`: `post('/')`, `post('/multiple')`, `put('/:id')`, `delete('/:id')`.
  - `routes/formacion.js`: `post('/')`, `put('/:id')`, `delete('/:id')`.
  - `routes/formacionComplementaria.js`: `post('/')`, `put('/:id')`, `delete('/:id')`.
  - `routes/perfil.js`: `post('/')`, `put('/')`.
- Los `GET` de todas las rutas y `GET /api/curriculum` **siguen siendo públicos** y no cambian de comportamiento.
- Script nuevo `scripts/seedUsuario.js` y script npm `"seed": "node scripts/seedUsuario.js"`: conecta con `dbConnection()`, hace `Usuario.findOne({ email })` y, si no existe, crea `ammlink@hotmail.com` con la contraseña hasheada; si ya existe, no toca nada y lo dice por consola. Cierra la conexión y termina en ambos casos.
- El email y la contraseña del seed se leen de `SEED_USER_EMAIL` y `SEED_USER_PASSWORD` en `.env`, con `ammlink@hotmail.com` como valor por defecto del email. Se añaden las dos claves a `.env.template`.
- `.env` ya contiene `SECRET_JWT_SEED`; si estuviera vacío, el arranque del login falla (ver Riesgos).

**Fuera de alcance (para futuras specs):**

- Registro público de usuarios (`POST /api/auth/new`): hay un único usuario y se crea por seed.
- Roles, permisos o campo `rol` en el modelo `Usuario`.
- Recuperación y cambio de contraseña.
- Refresh tokens y revocación / lista negra de tokens: con `30d` y un solo usuario no compensa.
- Proteger los `GET` de `/api/experiencia`, `/api/formacion`, `/api/formacionComplementaria`, `/api/conocimiento` y `/api/perfil`.
- Proteger `GET /api/curriculum`: es la vista pública del CV.
- Rate limiting o bloqueo por intentos fallidos de login.
- Validación con `express-validator`: no se usa en ningún controlador del proyecto.
- Tests automáticos del backend: no existe infraestructura de tests aquí (la SPEC 12 del frontend solo montó Vitest en el frontend).
- Vincular el `Usuario` con el `Perfil` (mismo email, referencia, etc.): son documentos independientes.
- Logout en servidor: el token se descarta en el cliente.

## Modelo de datos

Colección nueva `usuarios` (mongoose la nombra `usuarios` a partir del modelo `Usuario`).

```js
// models/Usuario.js
const UsuarioSchema = Schema({
  nombre: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, unique: true },
  password: { type: String, required: true },
});

UsuarioSchema.method('toJSON', function () {
  const { __v, _id, password, ...object } = this.toObject();
  object.id = _id;
  return object;
});
```

Documento que crea el seed (el `password` se guarda **hasheado con bcrypt**, nunca en claro):

```json
{
  "nombre": "Antonio",
  "email": "ammlink@hotmail.com",
  "password": "$2a$10$..."
}
```

### Contrato de `POST /api/auth`

Entrada:

```json
{ "email": "ammlink@hotmail.com", "password": "PatoPato11.." }
```

Respuestas:

| Caso                   | Código | Cuerpo                                                                                         |
| ---------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| Credenciales correctas | 200    | `{ "uid": "664a...", "nombre": "Antonio", "email": "ammlink@hotmail.com", "token": "eyJ..." }` |
| Email inexistente      | 400    | `{ "msg": "Credenciales incorrectas" }`                                                        |
| Contraseña incorrecta  | 400    | `{ "msg": "Credenciales incorrectas" }`                                                        |
| Error inesperado       | 500    | `{ "msg": "Error al iniciar sesión" }`                                                         |

El mismo `msg` para email inexistente y contraseña incorrecta: no se informa de cuál de los dos ha fallado.

### Contrato de `GET /api/auth/renew`

Entrada: header `x-token` con el JWT. Sin body.

| Caso                                          | Código | Cuerpo                                                                                                                                     |
| --------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Token válido                                  | 200    | `{ "uid": "664a...", "nombre": "Antonio", "email": "ammlink@hotmail.com", "token": "eyJ..." }` (token **nuevo**, misma forma que el login) |
| Sin header `x-token`                          | 401    | `{ "msg": "No hay token en la petición" }`                                                                                                 |
| Token inválido o caducado                     | 401    | `{ "msg": "Token no válido" }`                                                                                                             |
| El uid del token ya no existe en la colección | 401    | `{ "msg": "Token no válido" }`                                                                                                             |

### Payload del JWT

```json
{ "uid": "664a...", "nombre": "Antonio", "iat": 1756...,  "exp": 1759... }
```

Firmado con `HS256` (por defecto) y `SECRET_JWT_SEED`. `expiresIn: '30d'`.

### Respuesta de las rutas protegidas sin token

Cualquier `POST`/`PUT`/`DELETE` de las cinco entidades sin `x-token` válido responde 401 con el mismo cuerpo que produce `validarJWT`, y **no ejecuta el controlador**: no escribe nada en la base de datos.

### Verificación manual (mongosh)

```js
db.usuarios.countDocuments(); // 1 tras el primer `npm run seed`, y sigue en 1 tras repetirlo
db.usuarios.findOne({ email: 'ammlink@hotmail.com' }); // password empieza por "$2a$" o "$2b$"
```

## Plan de implementación

1. Instalar `bcryptjs` y `jsonwebtoken` (`npm i bcryptjs jsonwebtoken`). Prueba: aparecen en `dependencies` y `require('jsonwebtoken')` no lanza.
2. Crear `models/Usuario.js` con el schema y el `toJSON` que elimina `password`. Prueba: `new Usuario({...}).toJSON()` no tiene `password`, `_id` ni `__v`, y sí `id`.
3. Crear `helpers/jwt.js` con `generarJWT(uid, nombre)` que devuelva una promesa y rechace si `jwt.sign` da error. Prueba: `await generarJWT('1','Antonio')` devuelve una cadena y `jwt.verify(token, process.env.SECRET_JWT_SEED)` devuelve `uid` y `nombre`.
4. Crear `scripts/seedUsuario.js` y el script npm `seed`. Prueba: `npm run seed` crea el usuario y lo dice; ejecutado por segunda vez avisa de que ya existe y `db.usuarios.countDocuments()` sigue en 1. Añadir `SEED_USER_EMAIL` y `SEED_USER_PASSWORD` a `.env.template` y a `.env` local.
5. Crear `controllers/auth.js` con `login`: desestructurar `email` y `password`, `Usuario.findOne({ email })`, 400 si no existe, `bcrypt.compareSync` y 400 si no casa, `generarJWT` y 200 con `uid`, `nombre`, `email` y `token`. `try/catch` con `console.error` y 500. Prueba: `POST /api/auth` con las credenciales del seed devuelve 200 con token; con la contraseña cambiada, 400.
6. Crear `middlewares/validarJWT.js`: `req.header('x-token')`, 401 si falta, `jwt.verify` dentro de `try/catch` y 401 `{ msg: 'Token no válido' }` en el `catch`, `req.uid` y `req.nombre` y `next()`. Prueba: aún sin usarlo, `require` de la función no lanza.
7. Añadir `revalidarToken` a `controllers/auth.js`: `Usuario.findById(req.uid)`, 401 si no existe, token nuevo con `generarJWT` y 200 con el mismo shape que el login. Crear `routes/auth.js` con `post('/', login)` y `get('/renew', validarJWT, revalidarToken)` y montarlo en `index.js`. Prueba: con el token del paso 5, `GET /api/auth/renew` devuelve 200 y un token distinto; sin header, 401.
8. Aplicar `validarJWT` a las rutas de escritura de `experiencia`, `conocimiento` (las dos rutas `post`), `formacion`, `formacionComplementaria` y `perfil`. Prueba: cada `POST`/`PUT`/`DELETE` sin token responde 401 y con token responde lo mismo que antes de esta spec.
9. Comprobación end to end: `GET /api/curriculum` y todos los `GET` siguen respondiendo 200 sin token; `POST /api/experiencia` sin token → 401 y la colección no cambia; login → token → el mismo `POST` con `x-token` → 201.
10. `npm run lint` y `npm run format:check` sin errores nuevos.

## Criterios de aceptación

- [ ] `npm run seed` crea el usuario `ammlink@hotmail.com` con la contraseña hasheada, y repetido no crea un segundo documento.
- [ ] `db.usuarios.findOne()` guarda un `password` que empieza por `$2` y nunca la cadena `PatoPato11..`.
- [ ] `POST /api/auth` con `ammlink@hotmail.com` / `PatoPato11..` responde 200 con `uid`, `nombre`, `email` y `token`.
- [ ] La respuesta del login **no** incluye `password` en ningún caso.
- [ ] `POST /api/auth` con un email inexistente responde 400 con `{ msg: "Credenciales incorrectas" }`.
- [ ] `POST /api/auth` con la contraseña equivocada responde 400 con el mismo `msg` que el email inexistente.
- [ ] El token devuelto verifica con `SECRET_JWT_SEED` y su payload lleva `uid` y `nombre`.
- [ ] El token caduca a los 30 días (`exp - iat` = 2592000).
- [ ] `GET /api/auth/renew` con un token válido responde 200 con un token nuevo y el mismo `uid`.
- [ ] `GET /api/auth/renew` sin header `x-token` responde 401 con `{ msg: "No hay token en la petición" }`.
- [ ] `GET /api/auth/renew` con un token manipulado responde 401 con `{ msg: "Token no válido" }`.
- [ ] `POST`, `PUT` y `DELETE` de `/api/experiencia`, `/api/formacion`, `/api/formacionComplementaria`, `/api/conocimiento` (incluido `/multiple`) y `/api/perfil` responden 401 sin token válido.
- [ ] Ninguna petición rechazada con 401 modifica la base de datos.
- [ ] Con un token válido en `x-token`, esos mismos endpoints responden exactamente igual que antes de esta spec (mismos códigos y mismo shape).
- [ ] `GET /api/curriculum` y los `GET` de las cinco entidades siguen respondiendo sin token.
- [ ] `.env.template` incluye `SEED_USER_EMAIL` y `SEED_USER_PASSWORD`, y el `.env` real no se versiona.
- [ ] `npm run lint` y `npm run format:check` terminan sin errores nuevos.

## Decisiones

- **Sí:** JWT en el header `x-token` en vez de cookie de sesión. `SECRET_JWT_SEED` ya está en `.env.template`, evita configurar CORS con `credentials` y el frontend puede añadirlo con un interceptor de axios.
- **Sí:** `bcryptjs` en vez de `bcrypt`. No necesita compilación nativa, que en Windows es la fuente habitual de problemas de instalación.
- **Sí:** caducidad de 30 días. Es un CV personal de un solo usuario; se prioriza no tener que reloguear cada dos horas. Se acepta la ventana si el token se filtra (ver Riesgos).
- **Sí:** `GET /api/auth/renew` devuelve un token **nuevo**, no el mismo. Así la sesión se renueva mientras se use la aplicación.
- **Sí:** `validarJWT` ruta a ruta y no `app.use` global. Los `GET` deben seguir públicos para que `/curriculum` funcione sin login, y aplicarlo verbo a verbo lo deja explícito en cada `routes/*.js`.
- **Sí:** proteger la escritura del backend, no solo las rutas del frontend. Sin esto, cualquiera con `curl` seguiría escribiendo y el login sería decorativo.
- **No:** proteger los `GET` de las entidades de edición. Hoy el frontend público no los usa, pero mantenerlos abiertos evita tocar cualquier consumidor existente y no expone nada que `/api/curriculum` no exponga ya.
- **Sí:** el mismo `msg` `"Credenciales incorrectas"` para email inexistente y contraseña mala. No se filtra qué emails existen en la base de datos.
- **Sí:** 400 en el login fallido y 401 en el token inválido. El 400 corresponde a un cuerpo con credenciales que no casan; el 401 a la ausencia de una identidad válida.
- **Sí:** seed idempotente por script versionado, no endpoint de registro. Un `POST /api/auth/new` público dejaría abierta la creación de usuarios; a mano con `mongosh` no quedaría versionado ni sería repetible.
- **Sí:** contraseña del seed desde `.env` (`SEED_USER_PASSWORD`). `PatoPato11..` no debe quedar escrita en un archivo versionado.
- **Sí:** ocultar `password` en el `toJSON` del modelo, además de no devolverlo nunca a mano. Es la red de seguridad frente a un futuro endpoint que devuelva un usuario entero.
- **No:** refresh tokens ni revocación. Un único usuario y un token de 30 días; la complejidad no se paga.
- **No:** `express-validator`. Ningún controlador del proyecto valida hoy y el contrato del login es de dos campos.

## Riesgos

| Riesgo                                                                                                                   | Mitigación                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `SECRET_JWT_SEED` vacío o ausente en `.env`: `jwt.sign` firmaría con `undefined` y fallaría o generaría tokens triviales | El paso 1 verifica que la clave tiene valor en el `.env` local. Está en `.env.template` desde antes de esta spec                    |
| Un token de 30 días filtrado (localStorage, XSS) da acceso de escritura durante un mes sin forma de revocarlo            | Aceptado y consciente: un solo usuario, un CV personal. Si hace falta, cambiar `SECRET_JWT_SEED` invalida todos los tokens de golpe |
| Aplicar `validarJWT` rompe algún consumidor existente que escriba sin token                                              | El único consumidor es el frontend, que en la SPEC 14 añade el interceptor con `x-token`. Las dos specs se despliegan juntas        |
| Olvidar una ruta de escritura al aplicar el middleware (p. ej. `post('/multiple')` de conocimiento)                      | El criterio de aceptación las enumera una a una, `/multiple` incluida, y el paso 8 las recorre archivo por archivo                  |
| `npm run seed` ejecutado contra la base de datos equivocada por un `DB_CONN` mal apuntado                                | El script imprime la base de datos a la que se ha conectado antes de escribir, y es idempotente                                     |
| El `unique` del email solo se aplica si el índice llega a crearse; en una colección nueva mongoose lo crea al arrancar   | Con un único usuario creado por seed idempotente, la duplicidad no llega a darse                                                    |
| `bcrypt.compareSync` bloquea el event loop en cada login                                                                 | Aceptado: un usuario, logins esporádicos, coste ~100 ms con 10 rondas                                                               |
