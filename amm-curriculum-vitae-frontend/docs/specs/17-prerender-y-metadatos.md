# SPEC 17 — Prerender de la página pública y metadatos para compartir

> **Estado:** Aprobado
> **Depende de:** SPEC 09 (`09-curriculum-pestanas-y-contacto.md`), que creó `Tabs`; SPEC 15 (`15-expandable.md`, Implementado), cuya decisión de renderizado condicional se revierte aquí; SPEC 13 (`13-tests-componentes-vitest.md`, Implementada), que fija los tests de `Tabs` y `Expandable` que hay que adaptar
> **Fecha:** 2026-10-02
> **Objetivo:** Que el HTML inicial de `/` lleve ya el CV completo, un `<title>`, una meta description y las etiquetas Open Graph rellenados con los datos de la API en tiempo de build, para que rastreadores y previsualizadores de enlaces que no ejecutan JavaScript vean el contenido.

## Situación de partida

- `index.html` se sirve con `<title>Curriculum Vitae</title>` y `<div id="root"></div>` vacío. Todo lo demás lo pinta React en el navegador.
- `Curriculum.tsx` ya pone `document.title` y el favicon desde `perfil`, pero en un efecto: quien no ejecuta JS no lo ve.
- `Tabs` solo monta el panel de la pestaña activa y `Expandable` solo monta `children` cuando está abierto. Aunque se prerenderizase tal cual, el HTML llevaría el perfil, el contacto y los nombres de empresa, nada más.
- `vercel.json` reescribe todas las rutas a `/index.html`.
- No hay etiquetas Open Graph ni meta description.

## Alcance

**Dentro:**

- **Prerender de `/` en build**, con el patrón SSR de Vite y sin dependencias nuevas:
  - `src/entry-server.tsx`: exporta una función que recibe el `Curriculum`, lo despacha al store con `setCurriculum` y devuelve el `renderToString` del mismo árbol que `src/index.tsx` (`ErrorBoundary` → `Provider` → router estático en `/` → `Router`).
  - `scripts/prerender.mjs`: pide `GET {VITE_BASE_URL}/curriculum`, llama a la función anterior y reescribe `dist/index.html`.
  - `npm run build` pasa a encadenar build de cliente, build SSR (`dist-server/`) y el script. Se añade `build:spa` con el `vite build` de siempre.
- **Carcasa SPA para el resto de rutas**: antes de reescribir `dist/index.html`, el script lo copia tal cual a `dist/spa.html`. `vercel.json` reescribe a `/spa.html`; `/` la sirve el `index.html` prerenderizado.
- **Hidratación en `src/index.tsx`**:
  - Si existe `window.__CURRICULUM__`, se despacha `setCurriculum` antes de montar.
  - Si además la ruta es `/` y `#root` tiene contenido, se monta con `hydrateRoot`; en cualquier otro caso, con `createRoot` como hoy.
  - Tras hidratar, **una** petición `GET /curriculum` en segundo plano que despacha `setCurriculum` con lo que llegue. Sin spinner; si falla, se queda lo prerenderizado y no se muestra error.
- **Metadatos inyectados en `<head>` por el script**, calculados por un helper puro `src/helpers/metasCurriculum.ts`:
  - `<title>`: `Nombre Apellidos | Curriculum Vitae` (mismo formato que el efecto actual de `Curriculum.tsx`, que pasa a usar el helper). Sin perfil: `Curriculum Vitae`.
  - `<meta name="description">`: `perfil.descripcion` con espacios colapsados y recortada a 160 caracteres.
  - `og:type` (`website`), `og:locale` (`es_ES`), `og:title`, `og:description`, `og:url`, `og:image` y `twitter:card`.
  - `og:image`: misma regla que el favicon. Con `perfil.foto`, esa URL; sin foto, `{VITE_SITE_URL}/og-image.png`.
  - `twitter:card`: `summary` con foto de perfil, `summary_large_image` con la tarjeta por defecto.
  - `<link id="favicon">`: con `perfil.foto` apunta a la foto y pierde el `type`, igual que hace hoy el efecto.
- **`public/og-image.png`**: 1200×630, fondo `#0024ea` y "CV" en blanco, mismo diseño que `public/favicon.svg`. Se genera una vez durante la implementación y se commitea; la herramienta usada para generarlo no queda como dependencia.
- **Variable `VITE_SITE_URL`**: URL pública del sitio sin barra final. Se usa para `og:url` y para la tarjeta por defecto. Cambiar de dominio es cambiar esta variable y redesplegar.
- **`Tabs`**: se pintan todos los paneles; los inactivos llevan `hidden`. Cada panel tiene su propio `id` y cada pestaña apunta al suyo con `aria-controls`.
- **`Expandable`**: el contenedor de `children` se pinta siempre; plegado lleva `hidden`.
- `Tabs.module.scss` y `Expandable.module.scss`: regla `[hidden] { display: none }` sobre `.panel` y `.contenido`, porque su `display: flex` / `display: grid` anula el `hidden` del navegador.
- Tests: adaptar `test/components/Tabs.test.tsx` y `test/components/Expandable.test.tsx`, y añadir `test/helpers/metasCurriculum.test.tsx`.
- `README.md` del frontend: build con prerender, `VITE_SITE_URL`, redeploy tras editar el CV y pasos para cambiar la URL en Vercel.

**Fuera de alcance (para futuras specs):**

- Redeploy automático al guardar en el panel (Deploy Hook de Vercel llamado desde el backend). El redeploy es manual.
- Prerender de `/login` y de las rutas privadas.
- Migrar a React Router en modo framework, Next.js o Astro.
- `sitemap.xml`, `<link rel="canonical">`, datos estructurados JSON-LD y cambios en `robots.txt`.
- Generar la imagen Open Graph dinámicamente (nombre y foto compuestos en una tarjeta).
- Comprar o configurar el dominio: es un paso manual en el panel de Vercel; aquí solo se documenta.
- Invalidar el `curriculum` del store al editar desde el panel dentro de la misma sesión. Ya ocurre hoy y no cambia.
- Cambios en el backend.

## Modelo de datos

No hay estructuras persistidas nuevas. Se introducen:

**Resultado del helper `metasCurriculum(perfil, siteUrl)`**

| Campo         | Tipo                                 | Origen                                                     |
| ------------- | ------------------------------------ | ---------------------------------------------------------- |
| `titulo`      | `string`                             | `nombre` + `apellidos` + `\| Curriculum Vitae`             |
| `descripcion` | `string`                             | `perfil.descripcion`, máx. 160 caracteres; `''` sin perfil |
| `url`         | `string`                             | `siteUrl` + `/`                                            |
| `imagen`      | `string`                             | `perfil.foto` o `siteUrl` + `/og-image.png`                |
| `tarjeta`     | `'summary' \| 'summary_large_image'` | según haya foto o no                                       |
| `favicon`     | `string \| null`                     | `perfil.foto` o `null` (se deja el SVG)                    |

El helper exporta también la función que compone el título, para que `Curriculum.tsx` y el prerender no dupliquen el formato.

**Global de hidratación**

- `window.__CURRICULUM__?: Curriculum`, declarado en `src/vite-env.d.ts`. Lo escribe el script en un `<script>` inline antes del módulo de la app, con `<` escapado como `<`.

**Variables de entorno**

| Variable        | Dónde se lee                      | Si falta en el build |
| --------------- | --------------------------------- | -------------------- |
| `VITE_BASE_URL` | app (ya existe) y `prerender.mjs` | el build falla       |
| `VITE_SITE_URL` | `prerender.mjs`                   | el build falla       |

El script las carga con `loadEnv` de Vite: `.env` en local, variables del proyecto en Vercel.

**Ficheros**

| Fichero                                          | Cambio                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------- |
| `src/entry-server.tsx`                           | nuevo                                                                       |
| `src/helpers/metasCurriculum.ts`                 | nuevo                                                                       |
| `scripts/prerender.mjs`                          | nuevo                                                                       |
| `public/og-image.png`                            | nuevo                                                                       |
| `test/helpers/metasCurriculum.test.tsx`          | nuevo                                                                       |
| `src/index.tsx`                                  | `hydrateRoot` condicional, precarga del store y revalidación                |
| `src/vite-env.d.ts`                              | tipo de `window.__CURRICULUM__`                                             |
| `src/pages/Curriculum.tsx`                       | el título sale del helper; nada más                                         |
| `src/components/Tabs.tsx` + `.module.scss`       | todos los paneles en el DOM con `hidden`                                    |
| `src/components/Expandable.tsx` + `.module.scss` | contenido siempre en el DOM con `hidden`                                    |
| `test/components/Tabs.test.tsx`                  | "no está en el documento" pasa a "no es visible"; `aria-controls` por panel |
| `test/components/Expandable.test.tsx`            | ídem para el contenido plegado                                              |
| `package.json`                                   | scripts `build` y `build:spa`                                               |
| `vercel.json`                                    | destino del rewrite: `/spa.html`                                            |
| `vite.config.js`                                 | `src/entry-server.tsx` fuera de cobertura, como `src/index.tsx`             |
| `.gitignore`, ignores de ESLint y Prettier       | `dist-server/`                                                              |
| `eslint.config.mjs`                              | globals de Node para `scripts/**` si el lint los pide                       |
| `.env`                                           | `VITE_SITE_URL`                                                             |
| `README.md`                                      | secciones de variables, scripts y despliegue                                |

`index.html` no cambia: el script localiza `<title>…</title>`, `</head>`, `<link id="favicon" …>` y `<div id="root"></div>` en el HTML ya compilado. Si no encuentra alguno de los cuatro, falla.

## Plan de implementación

1. **`Tabs` y `Expandable` con `hidden`.** Cambiar los dos componentes y sus `.module.scss`; adaptar los tests. Comprobación: `npm test` en verde; en el navegador, las pestañas y los plegables se ven y se animan igual que antes, y en el inspector los paneles inactivos y los contenidos plegados están en el DOM con `hidden`.
2. **Helper `metasCurriculum` y su test.** `Curriculum.tsx` toma el título de ahí. Comprobación: `npm run verify` en verde y el título de la pestaña del navegador no cambia.
3. **`public/og-image.png`.** Generarlo desde el diseño de `favicon.svg` a 1200×630. Comprobación: abre en `/og-image.png` con `npm run dev`.
4. **`src/entry-server.tsx` y build SSR.** Añadir `dist-server/` a los ignores. Comprobación: el build SSR compila y la función devuelve HTML con el nombre del perfil al pasarle un currículum de prueba.
5. **`scripts/prerender.mjs` y scripts de `package.json`.** El script fija `TZ=Europe/Madrid`, carga las variables, pide el currículum, copia `dist/index.html` a `dist/spa.html`, inyecta contenido, estado y metadatos, y borra `dist-server/`. Sale con código distinto de 0 si falta una variable, la API no responde con 200 o no encuentra un marcador. Comprobación: con el backend levantado, `npm run build` deja en `dist/index.html` el nombre, las empresas, las formaciones, los conocimientos y las etiquetas `og:*`; con el backend parado, `npm run build` falla con un mensaje claro.
6. **Hidratación y revalidación en `src/index.tsx`.** Comprobación: `npm run build && npm run preview`; en `/` no hay avisos de hidratación en consola, no aparece el spinner y en la pestaña de red hay una sola llamada a `/curriculum`. En `/login` la app carga sin avisos.
7. **`vercel.json`.** Rewrite a `/spa.html`. Comprobación en un deploy de preview de Vercel: "ver código fuente" de `/` muestra el CV; `/login` y una ruta privada cargan al entrar directamente y al recargar; una ruta inexistente redirige a `/`.
8. **README.** Variables, scripts, redeploy tras editar el CV y cambio de URL en Vercel (renombrar el subdominio `*.vercel.app` desde Settings → Domains, o añadir un dominio propio y sus DNS). Contrastar los pasos con la documentación de Vercel al escribirlos: en la fase de definición no se verificaron.
9. **Producción.** Añadir `VITE_SITE_URL` en las variables del proyecto en Vercel, desplegar y pasar la URL por LinkedIn Post Inspector y por un chat de WhatsApp.
10. `npm run verify` y `npm run test:coverage` completos.

## Criterios de aceptación

- [ ] Tras `npm run build`, `dist/index.html` contiene dentro de `#root` el nombre y apellidos, la descripción, el email, todas las empresas con sus descripciones, hitos y tecnologías, todas las formaciones, todas las formaciones complementarias y todos los conocimientos que devuelve la API.
- [ ] `dist/index.html` tiene `<title>Nombre Apellidos | Curriculum Vitae</title>` y una `<meta name="description">` no vacía de 160 caracteres como máximo.
- [ ] `dist/index.html` tiene `og:type`, `og:locale`, `og:title`, `og:description`, `og:url`, `og:image` y `twitter:card`; `og:url` y `og:image` son URLs absolutas.
- [ ] Con `perfil.foto`, `og:image` y el `href` del favicon son esa URL; sin foto, `og:image` es `{VITE_SITE_URL}/og-image.png` y el favicon sigue siendo `/favicon.svg`.
- [ ] `public/og-image.png` existe y mide 1200×630.
- [ ] `dist/spa.html` existe, tiene `<div id="root"></div>` vacío y no contiene `__CURRICULUM__`.
- [ ] `dist-server/` no existe al terminar el build y no está en el repositorio.
- [ ] Con la API caída o sin `VITE_SITE_URL`, `npm run build` termina con código distinto de 0.
- [ ] En el sitio desplegado, la respuesta HTML de `/` sin ejecutar JavaScript contiene el nombre del perfil y al menos una empresa.
- [ ] En `/` no se muestra el spinner en la carga inicial y la consola no tiene avisos de hidratación.
- [ ] En `/` se hace exactamente una petición a `/curriculum` tras hidratar; si se edita el CV en el panel y se recarga `/` sin redesplegar, se ven los datos nuevos.
- [ ] `/login`, `/experiencia`, `/conocimiento`, `/formacion`, `/formacion-complementaria` y `/perfil` cargan al entrar por URL directa y al recargar, en `npm run preview` y en Vercel.
- [ ] En `Tabs`, los cuatro paneles están en el DOM, solo el activo es visible y cada pestaña tiene un `aria-controls` que apunta a un `id` existente.
- [ ] En `Expandable`, el contenido plegado está en el DOM con `hidden`; al abrir se ve y `aria-expanded` pasa a `true`.
- [ ] El PDF exportado es idéntico al de antes.
- [ ] LinkedIn Post Inspector muestra título, descripción e imagen para la URL de producción.
- [ ] `npm run verify` y `npm run test:coverage` terminan en verde con el umbral del 80%.
- [ ] El README documenta `VITE_SITE_URL`, el build con prerender, el redeploy tras editar el CV y cómo cambiar la URL en Vercel.

## Decisiones tomadas y descartadas

- **Sí:** prerender real con `renderToString` + `hydrateRoot`. **No:** inyectar una plantilla HTML aparte dentro de `#root` (duplica el marcado y parpadea), una función de Vercel por petición (pieza nueva fuera de Vite) ni migrar de framework (rehacer router, store y tests).
- **Sí:** script propio sobre el build SSR de Vite. **No:** plugin de prerender de terceros ni navegador headless en el build.
- **Sí:** datos leídos de la API en el build y redeploy manual tras editar el CV. **No:** Deploy Hook automático (toca el backend y lanza un build por guardado) ni textos fijos en `index.html`.
- **Sí:** revalidar una vez en segundo plano tras hidratar. Las personas ven siempre lo último; solo los rastreadores dependen del último build. **No:** servir solo los datos del build.
- **Sí:** si la API falla o falta una variable, el build falla. Vercel mantiene el último deploy bueno y nunca se publica la página vacía. **No:** degradar en silencio a la SPA sin prerender.
- **Sí:** todo el contenido en el DOM con `hidden` en `Tabs` y `Expandable`. Revierte la decisión de SPEC 15 de renderizado condicional: entonces no había prerender y ahora ese contenido tiene que estar en el HTML. **No:** prerenderizar con todo abierto (desajuste de hidratación), bloque semántico duplicado fuera de `#root` ni aceptar contenido parcial.
- **Sí:** `og:image` con la misma regla que el favicon (`perfil.foto` o imagen por defecto). La imagen por defecto es un PNG porque los previsualizadores no pintan SVG.
- **Sí:** `og-image.png` generado una vez y commiteado. **No:** generarlo en cada build con una dependencia nueva.
- **Sí:** `spa.html` como carcasa del resto de rutas. Con el rewrite actual, `/login` recibiría el HTML del CV y la hidratación no cuadraría.
- **Sí:** además del rewrite, `index.tsx` solo hidrata si la ruta es `/`. `vite preview` sirve `index.html` para todas las rutas y no lee `vercel.json`.
- **Sí:** el estado inicial se carga despachando `setCurriculum` sobre el store existente. **No:** convertir `store.ts` en una fábrica con `preloadedState`; `api.ts` importa el store como singleton y el cambio se extendería a todos los hooks.
- **Sí:** la revalidación vive en `index.tsx`, no en `Curriculum.tsx`. `getCurriculum` activa `loading` y cambiaría el contenido por el spinner.
- **Sí:** un único helper para título y metadatos, compartido por el efecto de `Curriculum.tsx` y el prerender.
- **Sí:** `VITE_SITE_URL` por variable de entorno. El cambio de dominio no toca código.
- **Sí:** `npm run build` incluye el prerender, porque es el comando que ejecuta Vercel; `build:spa` queda para compilar sin backend.
- **No:** tests de `entry-server.tsx`, `index.tsx` y `prerender.mjs`. Son puntos de entrada; se verifican con los pasos 5 a 7 del plan.

## Riesgos identificados

| Riesgo                                                                                                   | Mitigación                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desajuste de hidratación por zona horaria: `dateConverter` usa mes y año locales y el build corre en UTC | El script fija `TZ=Europe/Madrid`. Un visitante en otra zona puede ver un aviso en consola y React repinta ese tramo; el contenido sigue siendo correcto |
| Los nombres de clase de CSS Modules difieren entre el build SSR y el de cliente                          | Los dos builds usan la misma configuración de Vite; el paso 6 comprueba que no hay avisos y que los estilos se aplican                                   |
| Algún módulo toca `window`, `document` o `localStorage` al importarse y rompe el build SSR               | Hoy solo se usan dentro de efectos, manejadores e interceptores; el paso 4 lo confirma. `html2canvas` y `jspdf` ya se cargan con `import()` dinámico     |
| El store es un singleton y el render de servidor lo deja con datos                                       | El script hace un solo render por proceso y termina                                                                                                      |
| Vercel aplica el rewrite también a `/` y sirve `spa.html`                                                | El paso 7 lo comprueba en un deploy de preview antes de producción; si ocurre, se excluye `/` del patrón del rewrite                                     |
| `hidden` no oculta porque el `display` del módulo gana al del navegador                                  | Regla `[hidden]` explícita en los dos `.module.scss`; los tests usan `toBeVisible`                                                                       |
| La animación de `Expandable` no se reproduce al pasar de `hidden` a visible                              | El paso 1 lo comprueba a mano; una animación por `@keyframes` se relanza al dejar de estar en `display: none`                                            |
| El backend en frío tarda en responder y el build falla                                                   | Relanzar el deploy; si se repite, añadir un reintento al script                                                                                          |
| Se edita el CV y no se redespliega: rastreadores y tarjetas muestran datos viejos                        | Documentado en el README; las personas ven los datos nuevos por la revalidación. El Deploy Hook queda para otra spec                                     |
| `perfil.foto` no es pública o no es una imagen válida para tarjetas                                      | Se comprueba con Post Inspector en el paso 9; vaciando el campo foto se usa la tarjeta por defecto                                                       |
| Un backend caído bloquea cualquier deploy del frontend                                                   | Asumido: es preferible a publicar la página vacía. `build:spa` permite compilar en local sin backend                                                     |
