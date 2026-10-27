# Currículum Vitae — Antonio Macián Martínez

Mi currículum como aplicación web full-stack: una página pública pensada para reclutadores y un
panel privado desde el que edito el contenido sin tocar código. El CV se exporta a PDF con texto
real, apto para ATS.

**🔗 Web en producción:** <https://antonio-macian-martinez-cv-delta.vercel.app/>

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-2-764ABC?logo=redux&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_8-47A248?logo=mongodb&logoColor=white)
![Vitest](https://img.shields.io/badge/tests-Vitest-6E9F18?logo=vitest&logoColor=white)
![Vercel](https://img.shields.io/badge/deploy-Vercel-000000?logo=vercel&logoColor=white)

---

## ¿Qué hace?

- **CV público** en `/`: perfil, resumen profesional, experiencia con hitos, conocimientos
  ordenados por prioridad, formación y formación complementaria, organizados en pestañas
  accesibles (roles ARIA) y con vista adaptada a móvil.
- **Contacto directo**: enlaces a LinkedIn, GitHub, `mailto:` y `tel:`.
- **Exportación a PDF** con `@react-pdf/renderer`: texto seleccionable, enlaces y metadatos, no
  una imagen.
- **Prerender en el build**: el HTML de `/` llega con el CV completo, `<title>`, meta description
  y Open Graph, así que buscadores y tarjetas de LinkedIn/WhatsApp lo leen sin ejecutar JS. Luego
  la app se hidrata y refresca los datos en segundo plano.
- **Panel privado** (login con JWT) para crear, editar y borrar cada sección del CV.

## Arquitectura

```
┌──────────────────────────────┐   HTTPS / JSON   ┌───────────────────────────┐
│ Frontend (Vercel)            │ ───────────────▶ │ Backend (Vercel)          │
│ React 19 + TS + Vite         │                  │ Express 5 + Mongoose 8    │
│ Redux Toolkit · React Router │ ◀─────────────── │ JWT · bcrypt              │
│ Prerender SSR de "/"         │                  └─────────────┬─────────────┘
└──────────────────────────────┘                                │
                                                        ┌───────▼───────┐
                                                        │ MongoDB Atlas │
                                                        └───────────────┘
```

El repositorio es un monorepo con dos proyectos independientes:

| Directorio                                                         | Qué es                                                              |
| ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| [`amm-curriculum-vitae-frontend`](./amm-curriculum-vitae-frontend) | SPA en React + TypeScript: CV público, panel de edición y PDF.      |
| [`amm-curriculum-vitae-backend`](./amm-curriculum-vitae-backend)   | API REST en Express + MongoDB con autenticación JWT.                |

Cada uno tiene su propio README con instalación, variables de entorno, scripts y despliegue.

### API

Lectura pública, escritura protegida con `x-token`:

| Recurso                          | Endpoints                                             |
| -------------------------------- | ----------------------------------------------------- |
| `/api/curriculum`                | `GET` — el CV completo en una sola llamada             |
| `/api/perfil`                    | `GET` · `POST` · `PUT`                                |
| `/api/experiencia`               | `GET` · `POST` · `PUT /:id` · `DELETE /:id`           |
| `/api/conocimiento`              | `GET` · `POST` · `POST /multiple` · `PUT /:id` · `DELETE /:id` |
| `/api/formacion`                 | `GET` · `POST` · `PUT /:id` · `DELETE /:id`           |
| `/api/formacionComplementaria`   | `GET` · `POST` · `PUT /:id` · `DELETE /:id`           |
| `/api/auth`                      | `POST /` login · `GET /renew` revalidar token          |

## Puesta en marcha en local

Requisitos: **Node.js 20+** y una base de datos **MongoDB** (local o Atlas).

```bash
# 1. Backend
cd amm-curriculum-vitae-backend
npm install
cp .env.template .env   # rellenar DB_CONN, SECRET_JWT_SEED y SEED_USER_*
npm run seed            # crea el usuario del panel
npm run dev

# 2. Frontend (en otra terminal)
cd amm-curriculum-vitae-frontend
npm install
# .env con VITE_BASE_URL (URL del API) y VITE_SITE_URL
npm run dev             # http://localhost:5173
```

## Calidad

- **Tests**: Vitest en los dos proyectos. En el frontend, Testing Library sobre páginas y
  componentes; en el backend, tests de integración HTTP con `supertest` contra un MongoDB en
  memoria (`mongodb-memory-server`), sin mocks de modelos ni necesidad de `.env`.
- **Tipado**: TypeScript estricto en el frontend (`npm run typecheck`).
- **Estilo**: ESLint + Prettier en ambos. En el frontend, `npm run verify` lo encadena todo.
- **Build seguro**: el prerender falla si el API no responde o faltan variables, así que Vercel
  conserva el último deploy bueno y nunca publica una página vacía.

## Cómo se ha desarrollado

Cada funcionalidad parte de una especificación escrita antes del código, en
`docs/specs/` de cada proyecto (22 en el frontend, 12 en el backend): desde la edición de cada
sección hasta el prerender, el PDF con texto real o la estructura semántica del CV. Las mejoras
pendientes y ya aplicadas, a partir de una revisión de la web desde el punto de vista de un
reclutador, están en [`CAMBIOS_Y_MEJORAS.md`](./CAMBIOS_Y_MEJORAS.md).

## Autor

**Antonio Macián Martínez** — desarrollador front-end.
GitHub: [@Anthor85](https://github.com/Anthor85) · CV: <https://antonio-macian-martinez-cv-delta.vercel.app/>
