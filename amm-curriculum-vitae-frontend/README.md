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
```

## Scripts

| Script                                    | Qué hace                                                             |
| ----------------------------------------- | -------------------------------------------------------------------- |
| `npm run dev`                             | Servidor de desarrollo en `http://localhost:5173` con HMR.           |
| `npm run build`                           | Build de producción en `dist/`.                                      |
| `npm run preview`                         | Sirve el build de `dist/` para comprobarlo antes de desplegar.       |
| `npm test`                                | Tests con Vitest, una pasada.                                        |
| `npm run test:watch`                      | Tests en modo watch.                                                 |
| `npm run test:coverage`                   | Tests con informe de cobertura en `coverage/`.                       |
| `npm run typecheck`                       | Comprobación de tipos (`tsc --noEmit`). Vite no la hace en el build. |
| `npm run lint` / `npm run lint:fix`       | ESLint.                                                              |
| `npm run format` / `npm run format:check` | Prettier (escribe / solo comprueba).                                 |

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
docs/specs/     especificaciones de cada funcionalidad
references/     notas de refactor y deuda técnica
```

## Rutas

- `/` — currículum público.
- `/login` — acceso al panel.
- `/experiencia`, `/conocimiento`, `/formacion`, `/formacion-complementaria`, `/perfil` — privadas, protegidas por `RutaPrivada`.

Al arrancar se revalida el token guardado; mientras el estado es `checking` no se redirige a `/login`.

## Despliegue

Preparado para Vercel. `vercel.json` reescribe todas las rutas a `index.html` para que
el enrutado del lado del cliente funcione al recargar.
