# amm-curriculum-vitae — frontend

SPA de currículum vitae: muestra el CV público y permite editarlo desde un panel privado
(experiencia, conocimientos, formación, formación complementaria y perfil), con exportación a PDF.

Es el frontend del monorepo; el API vive en `../amm-curriculum-vitae-backend`.

## Stack

- **React 19** + **TypeScript**
- **Vite 7** (dev server y build)
- **Redux Toolkit** + **react-redux** para el estado
- **React Router 7** para el enrutado
- **Sass** con CSS Modules (`*.module.scss`)
- **axios** para las llamadas al API
- **jsPDF** + **html2canvas** para el export a PDF
- **Vitest** + **Testing Library** para los tests
- **ESLint** + **Prettier**

## Requisitos

- Node.js 20 o superior
- El backend levantado (por defecto en `http://localhost:3001`)

## Instalación

```bash
npm install
```

## Variables de entorno

Se leen con el prefijo `VITE_` desde `.env`:

```
VITE_MODE=dev
VITE_BASE_URL=http://localhost:3001/api
VITE_SITE_URL=http://localhost:4173
```

| Variable        | Para qué                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| `VITE_BASE_URL` | URL del API. La usa la app y también el prerender del build.                                                       |
| `VITE_SITE_URL` | URL pública del sitio, **sin barra final**. Solo la lee el prerender: `og:url` y la imagen Open Graph por defecto. |

`npm run build` falla si falta cualquiera de las dos. En Vercel se definen en las variables de
entorno del proyecto, no en `.env`.

## Scripts

| Script                                    | Qué hace                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| `npm run dev`                             | Servidor de desarrollo en `http://localhost:5173` con HMR.                      |
| `npm run build`                           | Build de producción en `dist/` con prerender de `/`. Necesita el API levantado. |
| `npm run build:spa`                       | Solo el `vite build`, sin prerender. Para compilar sin backend.                 |
| `npm run preview`                         | Sirve el build de `dist/` para comprobarlo antes de desplegar.                  |
| `npm test`                                | Tests con Vitest, una pasada.                                                   |
| `npm run test:watch`                      | Tests en modo watch.                                                            |
| `npm run test:coverage`                   | Tests con informe de cobertura en `coverage/`.                                  |
| `npm run typecheck`                       | Comprobación de tipos (`tsc --noEmit`). Vite no la hace en el build.            |
| `npm run lint` / `npm run lint:fix`       | ESLint.                                                                         |
| `npm run format` / `npm run format:check` | Prettier (escribe / solo comprueba).                                            |

## Estructura

```
src/
  api/          cliente axios con el interceptor del token
  components/   componentes reutilizables (Button, Tabs, MultiSelect, Expandable…)
  helpers/      utilidades: fechas, export a PDF, fábricas de slices y stores CRUD
  hooks/        un hook por dominio (useExperienciaStore, useAuthStore…)
  interfaces/   tipos compartidos
  pages/        páginas y sus cards/forms
  router/       rutas y RutaPrivada
  store/        slices de Redux Toolkit, uno por dominio
  styles/       estilos globales y variables Sass
test/           tests de páginas y componentes
scripts/        prerender.mjs: prerender de `/` al final del build
docs/specs/     especificaciones de cada funcionalidad
references/     notas de refactor y deuda técnica
```

## Rutas

- `/` — currículum público.
- `/login` — acceso al panel.
- `/experiencia`, `/conocimiento`, `/formacion`, `/formacion-complementaria`, `/perfil` — privadas, protegidas por `RutaPrivada`.

Al arrancar se revalida el token guardado; mientras el estado es `checking` no se redirige a `/login`.

## Build con prerender

`npm run build` encadena tres pasos:

1. `vite build`: el build de cliente de siempre, en `dist/`.
2. `vite build --ssr src/entry-server.tsx`: compila la app para Node en `dist-server/`.
3. `node scripts/prerender.mjs`: pide `GET {VITE_BASE_URL}/curriculum`, pinta la página con
   esos datos y reescribe `dist/index.html`. Al terminar borra `dist-server/`.

Resultado en `dist/`:

- `index.html`: el CV completo dentro de `#root`, `<title>`, meta description, etiquetas
  Open Graph y el currículum en `window.__CURRICULUM__` para hidratar. Es lo que ven los
  rastreadores y los previsualizadores de enlaces, que no ejecutan JavaScript.
- `spa.html`: la carcasa vacía original. La usan el resto de rutas (`/login` y las privadas).

Las pestañas inactivas y los plegables cerrados van en el HTML con el atributo `hidden`.

En el navegador, `/` se hidrata con los datos del build y a continuación pide una vez
`/curriculum` en segundo plano, así que las personas ven siempre la última versión del CV.

El build **falla** (código distinto de 0) si falta `VITE_BASE_URL` o `VITE_SITE_URL`, si el API
no responde con 200 o si no se encuentra algún marcador en `dist/index.html`. Es intencionado:
Vercel mantiene el último deploy bueno y nunca se publica la página vacía.

La imagen Open Graph es `perfil.foto` si existe; si no, `public/og-image.png` (1200×630).

## Despliegue

Preparado para Vercel. `/` la sirve el `index.html` prerenderizado y `vercel.json` reescribe
el resto de rutas a `spa.html` para que el enrutado del lado del cliente funcione al recargar.

Variables de entorno del proyecto en Vercel (Settings → Environment Variables):
`VITE_BASE_URL` y `VITE_SITE_URL`. Un cambio en ellas solo se aplica a los deploys nuevos:
hay que redesplegar.

El API tiene que estar accesible durante el build. Si está caído o arranca en frío y no llega a
responder, el deploy falla: basta con relanzarlo.

### Redesplegar tras editar el CV

Los datos del HTML inicial son los del momento del build. Después de editar el CV en el panel:

- Las personas ven los cambios al recargar, sin hacer nada.
- Los rastreadores y las tarjetas de enlace (LinkedIn, WhatsApp…) siguen viendo los datos
  viejos hasta que se redespliega.

El redeploy es manual: en el panel de Vercel, Deployments → menú del último deploy de
producción → Redeploy; o con la CLI, `vercel redeploy <url-del-deploy>`.

Las redes cachean las tarjetas. En LinkedIn se fuerza la actualización pasando la URL por
[Post Inspector](https://www.linkedin.com/post-inspector/).

### Cambiar la URL del sitio

1. Cambiar el dominio en Vercel, en Settings → Domains del proyecto:
   - **Subdominio `*.vercel.app`**: editar el dominio actual y ponerle otro nombre.
   - **Dominio propio**: añadirlo (o `vercel domains add ejemplo.com` desde el proyecto
     enlazado) y crear en el proveedor del dominio los registros DNS que indique Vercel: un
     registro `A` para el dominio raíz o un `CNAME` para un subdominio.
     `vercel domains inspect ejemplo.com` muestra los registros necesarios y si ya están
     verificados.
2. Actualizar `VITE_SITE_URL` con la URL nueva, sin barra final.
3. Redesplegar: `og:url` y la imagen por defecto se calculan en el build.
