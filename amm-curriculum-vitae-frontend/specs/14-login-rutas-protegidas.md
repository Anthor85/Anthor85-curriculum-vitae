# SPEC 14 — Login y protección de rutas privadas

> **Estado:** Draft
> **Depende de:** SPEC 07 del backend (`07-autenticacion-jwt.md`, Draft), que expone `POST /api/auth` y `GET /api/auth/renew` y protege la escritura; SPEC 08 (`08-mensaje-accion-formularios.md`, Implementada), que fija el comportamiento de `MensajeAccion`; SPEC 12 (`12-tests-paginas-vitest.md`, Implementada) y SPEC 13 (`13-tests-componentes-vitest.md`, Implementada), que montan Vitest, `test/utils/` y el bloque `coverage`
> **Fecha:** 2026-09-02
> **Objetivo:** Añadir la página `/login` (email + contraseña, estilos sobrios), un `authSlice` con el token en `localStorage` y revalidación al arrancar, un guard que deje `/experiencia`, `/formacion`, `/formacion-complementaria`, `/perfil` y `/conocimiento` accesibles solo con sesión, y `test/pages/Login.test.tsx`.

## Alcance

**Dentro:**

- Página nueva `src/pages/Login.tsx` con su `src/pages/Login.module.scss`, exportada desde `src/pages/index.ts`.
- Formulario con `<input type="email" name="email">`, `<input type="password" name="password">` (ambos `required`) y un `<Button name="Entrar" />`. Estilos mínimos reutilizando las variables y el aire de `Layout.module.scss`: una tarjeta centrada, sin nada más.
- Feedback de error con el componente existente `MensajeAccion` y el hook `useMensajeAccion`, igual que los formularios de edición. El texto en credenciales incorrectas es el `msg` del backend (`Credenciales incorrectas`); ante un error de red, `No se ha podido conectar`.
- Mientras la petición está en vuelo, el botón queda deshabilitado.
- Slice nuevo `src/store/auth/authSlice.ts` con `AuthState = { status: 'checking' | 'authenticated' | 'not-authenticated'; user: { uid, nombre, email } | null; errorMessage: string | null }` y las acciones `onChecking`, `onLogin`, `onLogout`. Estado inicial `status: 'checking'`. Registrado en `src/store/store.ts` y exportado desde `src/store/index.ts`.
- Hook nuevo `src/hooks/useAuthStore.ts` con `startLogin({ email, password })`, `checkAuthToken()` y `logout()`, exportado desde `src/hooks/index.ts`. Sigue el patrón de los `useXStore` existentes: `useDispatch` + `useSelector` + llamadas a `api`.
- Persistencia en `localStorage`: `token` y `token-init-date` se escriben en el login y se borran en `logout()` con `localStorage.clear()`.
- Interceptor de petición en `src/api/api.ts` que añade el header `x-token` con el token de `localStorage` cuando existe.
- Interfaces nuevas en `src/interfaces/auth.interface.ts`: `Usuario`, `AuthState`, `LoginPayload`, `LoginResponse`.
- Componente nuevo `src/router/RutaPrivada.tsx`: si `status === 'checking'` pinta `<p>Loading...</p>`; si `status === 'not-authenticated'` hace `<Navigate to="/login" state={{ from: location.pathname }} replace />`; si no, pinta sus hijos.
- `src/router/Router.tsx`: ruta nueva `/login`; las cinco rutas privadas envueltas en `RutaPrivada`; `/` sigue pública; el `catch-all` `/*` sigue redirigiendo a `/`. Si se entra en `/login` con sesión activa, se redirige a `/experiencia`.
- `src/Curriculum.tsx` (o el propio `Router`) llama a `checkAuthToken()` en un `useEffect` al montar: sin token en `localStorage`, `onLogout()` directo; con token, `GET /api/auth/renew` y `onLogin` o `onLogout` según la respuesta.
- Tras un login correcto: se navega a la ruta que el guard guardó en `location.state.from`, y a `/experiencia` si no hay ninguna (entrada directa por `/login`).
- Archivo nuevo `test/pages/Login.test.tsx`, mockeando `src/api/api` con `vi.hoisted` como los demás tests de páginas.
- `src/pages/Login.tsx` añadido al `coverage.include` de `vite.config.js`, sujeto al umbral global del 80%.

**Fuera de alcance (para futuras specs):**

- Menú de navegación entre las páginas privadas: lo dice el enunciado, va después.
- Botón o enlace de **logout** en la interfaz. `logout()` existe en el hook y se ejecuta al caducar el token, pero ninguna pantalla lo dispara a mano todavía.
- Registro de usuarios, recuperación y cambio de contraseña desde el frontend.
- Refresco automático del token en segundo plano o al recibir un 401 en una llamada cualquiera (interceptor de respuesta). El 401 se maneja como hasta ahora: la llamada falla y el hook correspondiente lo registra en consola.
- Recordar la sesión con "recuérdame", expiración configurable o cierre de sesión por inactividad.
- Ocultar `/` o cualquier parte del CV público.
- Tests del `authSlice`, del `useAuthStore` y de `RutaPrivada` de forma aislada, y tests del interceptor de axios. Se cubren indirectamente desde `Login.test.tsx`, que es el único archivo nuevo de test.
- Tests E2E del flujo completo login → ruta privada.
- Validar el formato del email en cliente más allá del `type="email"` del navegador.
- Rediseñar la pantalla: el enunciado pide algo simple.

## Modelo de datos

### `src/interfaces/auth.interface.ts`

```ts
export interface Usuario {
  uid: string;
  nombre: string;
  email: string;
}

export interface AuthState {
  status: 'checking' | 'authenticated' | 'not-authenticated';
  user: Usuario | null;
  errorMessage: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse extends Usuario {
  token: string;
}
```

### `authSlice`

| Acción | Efecto |
| --- | --- |
| `onChecking` | `status: 'checking'`, `user: null`, `errorMessage: null` |
| `onLogin(Usuario)` | `status: 'authenticated'`, `user: payload`, `errorMessage: null` |
| `onLogout(string \| null)` | `status: 'not-authenticated'`, `user: null`, `errorMessage: payload` |

Estado inicial: `{ status: 'checking', user: null, errorMessage: null }`. Arrancar en `checking` evita el parpadeo a `/login` mientras se revalida el token.

### Claves de `localStorage`

| Clave | Contenido |
| --- | --- |
| `token` | El JWT devuelto por `POST /api/auth` o por `GET /api/auth/renew` |
| `token-init-date` | `new Date().getTime()` del momento en que se guardó |

### Llamadas al backend

| Llamada | Petición | Respuesta usada |
| --- | --- | --- |
| `startLogin` | `POST /auth` con `{ email, password }` | 200 → `{ uid, nombre, email, token }`; 400 → `error.response.data.msg` |
| `checkAuthToken` | `GET /auth/renew` con `x-token` | 200 → `{ uid, nombre, email, token }`; 401 → `onLogout(null)` y `localStorage.clear()` |

### Casos de `test/pages/Login.test.tsx` (8 tests)

Render con `renderConStore` (el store de test incorpora el `auth` reducer) dentro de un `MemoryRouter`, con `api` mockeado.

1. Se pintan los dos inputs (email y contraseña) y el botón `Entrar`.
2. El input de contraseña es de tipo `password` y ambos inputs son `required`.
3. Al enviar con credenciales válidas, se llama a `api.post` una vez con `/auth` y el payload `{ email, password }` escrito en el formulario.
4. Tras un login correcto, el token y `token-init-date` quedan en `localStorage` y el estado del store pasa a `authenticated` con el `user` recibido.
5. Tras un login correcto se navega a `/experiencia` (se asserta sobre el elemento pintado por la ruta destino del `MemoryRouter` del test, no sobre un mock de `useNavigate`).
6. Con un 400 del backend se pinta `Credenciales incorrectas` vía `MensajeAccion` (avanzando los timers con `avanzarMensaje` de `test/utils`), el estado queda en `not-authenticated` y no se escribe nada en `localStorage`.
7. Con un rechazo sin `response` (error de red) se pinta `No se ha podido conectar`.
8. Mientras la promesa del login está pendiente, el botón está deshabilitado; al resolverse, vuelve a estar habilitado.

`localStorage` se limpia en un `beforeEach` para que los tests no dependan del orden.

## Plan de implementación

1. Crear `src/interfaces/auth.interface.ts` y `src/store/auth/authSlice.ts` con las tres acciones; registrar `auth: authSlice.reducer` en `src/store/store.ts`, exportarlo desde `src/store/index.ts` y añadirlo también a `crearStore` de `test/utils/renderConStore.tsx`. Comprobación: `npm test` sigue en verde y `npm run build` compila.
2. Añadir el interceptor de petición a `src/api/api.ts` que mete `x-token` desde `localStorage` cuando existe. Comprobación: los tests existentes de páginas siguen pasando (mockean el módulo entero, así que no les afecta).
3. Crear `src/hooks/useAuthStore.ts` con `startLogin`, `checkAuthToken` y `logout`, y exportarlo desde `src/hooks/index.ts`. Comprobación: `npm run lint` sin errores.
4. Crear `src/pages/Login.tsx` y `Login.module.scss` con el formulario, el estado local de los dos campos, el `Button`, el `MensajeAccion` y el botón deshabilitado durante la petición; exportar la página desde `src/pages/index.ts`. Comprobación: `/login` se pinta si se añade la ruta a mano en el navegador.
5. Crear `src/router/RutaPrivada.tsx` con los tres estados (`checking`, `not-authenticated`, autenticado) y el `state.from`.
6. Actualizar `src/router/Router.tsx`: ruta `/login` (con redirección a `/experiencia` si ya hay sesión), las cinco rutas privadas envueltas en `RutaPrivada`, `/` pública y el `catch-all` intacto. Comprobación manual: sin token, entrar en `/perfil` lleva a `/login`; tras entrar, se vuelve a `/perfil`.
7. Llamar a `checkAuthToken()` al montar la aplicación. Comprobación manual: con un token válido en `localStorage`, un refresco en `/experiencia` no rebota a `/login`; con un token manipulado, sí, y `localStorage` queda limpio.
8. Escribir `test/pages/Login.test.tsx` con los 8 casos. Comprobación: `npm test -- Login` en verde.
9. Añadir `src/pages/Login.tsx` al `coverage.include` de `vite.config.js` y ejecutar `npm run test:coverage` hasta pasar el umbral del 80% sin bajar el listón ni añadir umbrales propios.
10. Prueba end to end contra el backend de la SPEC 07: login real con `ammlink@hotmail.com`, edición y guardado en `/perfil` (la escritura ya exige `x-token`), refresco de la página y comprobación de que `/` sigue abierta en una ventana sin sesión.
11. `npm run lint` y `npm run build` sin errores nuevos.

## Criterios de aceptación

- [ ] `/login` pinta un formulario con email, contraseña y un botón `Entrar`.
- [ ] Un login correcto guarda `token` y `token-init-date` en `localStorage` y deja el store en `status: 'authenticated'`.
- [ ] Un login correcto desde `/login` navega a `/experiencia`.
- [ ] Entrar sin sesión en `/perfil` redirige a `/login`, y tras el login se vuelve a `/perfil`.
- [ ] Lo mismo para `/experiencia`, `/formacion`, `/formacion-complementaria` y `/conocimiento`.
- [ ] Un login fallido pinta `Credenciales incorrectas` mediante `MensajeAccion`, no escribe nada en `localStorage` y deja el store en `not-authenticated`.
- [ ] Un fallo de red pinta `No se ha podido conectar`.
- [ ] El botón `Entrar` está deshabilitado mientras la petición de login está en vuelo.
- [ ] Refrescar la página estando en una ruta privada con un token válido **no** devuelve a `/login`.
- [ ] Con un token caducado o manipulado, el arranque limpia `localStorage` y lleva a `/login`.
- [ ] Mientras `status === 'checking'` no se pinta ni el contenido privado ni la redirección a `/login`.
- [ ] Entrar en `/login` con sesión activa redirige a `/experiencia`.
- [ ] `/` sigue accesible sin sesión y el CV se pinta igual que antes de esta spec.
- [ ] Toda petición de axios lleva el header `x-token` cuando hay token en `localStorage`, y ninguno cuando no lo hay.
- [ ] Existe `test/pages/Login.test.tsx` con los 8 casos de la sección "Modelo de datos", cada uno en su propio `it`.
- [ ] `npm test` pasa con los tests existentes más los nuevos.
- [ ] `vite.config.js` incluye `src/pages/Login.tsx` en `coverage.include` y `npm run test:coverage` termina en verde con el umbral global del 80%, sin umbrales propios nuevos.
- [ ] `npm run build` y `npm run lint` terminan sin errores nuevos.

## Decisiones tomadas y descartadas

- **Sí:** slice de Redux (`authSlice`) en vez de un `AuthContext`. Todo el estado del proyecto vive en el store y los `useXStore` ya fijan el patrón; un contexto aparte sería una segunda forma de hacer lo mismo.
- **Sí:** token en `localStorage`. Sobrevive al refresco, que es lo que se pide; una cookie `httpOnly` obligaría a CORS con `credentials` y a cambiar el backend de la SPEC 07.
- **Sí:** estado inicial `checking` y revalidación con `GET /api/auth/renew` al arrancar. Sin ella, un token caducado dejaría entrar en la pantalla y todas las llamadas fallarían con 401 sin explicación.
- **Sí:** interceptor de petición en `api.ts` en vez de pasar el header en cada llamada. Es un solo punto y los hooks existentes no se tocan.
- **No:** interceptor de **respuesta** que haga logout ante cualquier 401. Añade un camino de cierre de sesión difícil de testear y ahora mismo el `renew` del arranque cubre el caso real. Queda para otra spec.
- **Sí:** volver a la ruta pedida tras el login, con `location.state.from`. El destino por defecto sigue siendo `/experiencia`, como pide el enunciado, para la entrada directa por `/login`.
- **Sí:** reutilizar `MensajeAccion` para el error. Es el componente de feedback del proyecto y mantiene la consistencia con los formularios de edición.
- **No:** botón de logout en esta spec. El enunciado aplaza la navegación al futuro menú; `logout()` queda escrito en el hook y se usa desde la revalidación.
- **Sí:** un componente `RutaPrivada` que envuelve rutas, en vez de repetir la comprobación en cada página. Deja el router como único sitio donde se decide qué es privado.
- **No:** proteger `/`. Es el CV público y su razón de ser es ser visible sin sesión.
- **Sí:** un único archivo de test nuevo (`Login.test.tsx`), como pide el enunciado. El slice, el hook y `RutaPrivada` quedan cubiertos indirectamente; sus tests aislados van en otra spec, igual que hizo la SPEC 13 con los helpers.
- **Sí:** testear la navegación con un `MemoryRouter` con rutas de verdad en vez de mockear `useNavigate`. Comprueba el efecto observable y no el detalle de implementación.
- **Sí:** añadir el reducer `auth` a `crearStore` de `test/utils/renderConStore.tsx`. Sin él, `renderConStore` no podría pintar nada que lea `state.auth`.
- **No:** validar el email en cliente más allá de `type="email"`. El backend responde con el mismo `Credenciales incorrectas` en cualquier caso.
- **Sí:** estilos mínimos (tarjeta centrada, campos apilados) reutilizando lo que ya hay. El enunciado lo pide explícitamente.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Los tests existentes de páginas se rompen al añadir el reducer `auth` al store de test | El paso 1 ejecuta `npm test` antes de seguir; el reducer nuevo no lo lee ninguna página existente |
| El `checking` inicial deja `Loading...` pegado si `checkAuthToken` no despacha nunca (excepción no capturada) | El `catch` del hook siempre termina en `onLogout`, y el camino "sin token en `localStorage`" despacha `onLogout` sin llamar a la API |
| El interceptor lee `localStorage` en cada petición y en jsdom podría no existir | Los tests de páginas mockean el módulo `api` entero, así que el interceptor no llega a ejecutarse; en `Login.test.tsx` jsdom sí provee `localStorage` |
| `localStorage.clear()` borra claves ajenas si en el futuro se guarda algo más | Hoy solo se guardan estas dos claves. Si aparecen más, se cambia a `removeItem` en su propia spec |
| Estado de sesión filtrado entre tests por no limpiar `localStorage` | `beforeEach` con `localStorage.clear()` en `Login.test.tsx` |
| Alcanzar el 80% de cobertura en `Login.tsx` sin cubrir la rama del error de red | Es el caso 7 de los tests, escrito explícitamente para esa rama |
| Redirigir a `/login` desde `RutaPrivada` con `state.from` y volver luego a una ruta que ya no existe | Las cinco rutas privadas están fijadas en el router; el `catch-all` a `/` cubre cualquier otra |
| El frontend se despliega antes que la SPEC 07 y el login apunta a un endpoint inexistente | Las dos specs se implementan y despliegan juntas; la 14 depende explícitamente de la 07 |
