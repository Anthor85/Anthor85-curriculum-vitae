# SPEC 23 — Versión en inglés: i18next, rutas `/` y `/en`, `hreflang` y formularios bilingües

> **Estado:** Aprobada
> **Depende de:** SPEC 13 backend (`13-contenido-bilingue.md`), que fija `{ es, en }`, `GET /api/curriculum?lang=` y `POST /api/traduccion`; SPEC 17 (`17-prerender-y-metadatos.md`), cuyo prerender se duplica por idioma; SPEC 20 (`20-prioridad-conocimiento-frontend.md`), cuyo enum cambia a claves
> **Fecha:** 2026-11-02
> **Enmienda:** 2026-11-03 — `Conocimiento.titulo` bilingüe, a la par que la enmienda de la SPEC 13 (ver «Enmiendas»)
> **Objetivo:** Publicar el CV en español (`/`) y en inglés (`/en`) con selector de idioma y `hreflang`. Los textos fijos van con i18next y el contenido viene de la API ya resuelto. Los formularios del admin editan cada campo en ES y EN, con un botón «Sugerir EN».

## Alcance

**Dentro:**

- `i18next` + `react-i18next` con recursos empaquetados en `src/i18n/locales/es.json` y `en.json` (init síncrono, válido para el prerender).
- Textos fijos de la **parte pública**: `Curriculum`, `items/*`, `Contacto`, `Resumen` («Ver más»), `Tabs`, `ErrorBoundary`, `Spinner` (si tiene texto), `rangoFechas` («En la actualidad»), PDF, nombre del fichero PDF y metadatos.
- Rutas `/` (es) y `/en` (en), ambas con `Curriculum`. El idioma se deduce de la ruta.
- Selector de idioma ES | EN en la página del CV, hecho con enlaces (`<Link hrefLang>`).
- `useCurriculumStore` pide `/curriculum?lang=` y guarda en el store un currículum por idioma.
- Prerender de `/` y `/en` con `<html lang>`, `hreflang` cruzados, `canonical`, `og:locale` y `og:url` propios. Regla en `vercel.json` para `/en`.
- Admin: interfaces con `TextoLocalizado`, formularios con campos ES/EN y botón «Sugerir EN» que llama a `POST /traduccion`. Las cards muestran la versión ES y una marca «Sin EN» si falta la traducción.
- `ConocimientoPrioridad` pasa a claves (`muyAlta`…) con etiquetas en español para el admin.
- `Conocimiento.titulo` bilingüe (enmienda): tipo genérico, `CampoLocalizado` con «Sugerir EN» en `ConocimientoForm` y versión ES en el admin.

**Fuera de alcance:**

- Más idiomas que ES y EN: `Idioma = 'es' | 'en'` es un tipo cerrado.
- Traducir la interfaz del admin (`Header`, formularios, mensajes): solo la usa el dueño y queda en español.
- Redirigir según `Accept-Language` o recordar el idioma en `localStorage`: el idioma lo marca solo la URL.
- `sitemap.xml` (spec aparte si se quiere).
- `i18next-browser-languagedetector` e `i18next-http-backend`: con dos ficheros pequeños no compensan.

## Tipos

```ts
// interfaces/idioma.interface.ts
export const IDIOMAS = ['es', 'en'] as const;
export type Idioma = (typeof IDIOMAS)[number];

export interface TextoLocalizado {
  es: string;
  en: string;
}
```

Las entidades se parametrizan con el tipo del texto. El admin trabaja con `TextoLocalizado` y el CV público con `string`:

```ts
export interface Hito<T = TextoLocalizado> {
  id: string;
  descripcion: T;
  experiencia: string;
}

export interface Experiencia<T = TextoLocalizado> {
  id: string;
  empresa: string;
  descripcion: T;
  fechaInicio: string;
  fechaFin?: string;
  tecnologias: string[];
  hitos: Hito<T>[];
}

export interface Conocimiento<T = TextoLocalizado> {
  id: string;
  titulo: T; // enmienda
  prioridad: ConocimientoPrioridad;
}

// curriculum.interface.ts: lo que devuelve /curriculum?lang=
export interface Curriculum {
  conocimiento: Conocimiento<string>[];
  experiencia: Experiencia<string>[];
  formaciones: Formacion<string>[];
  formacionesComplementarias: FormacionComplementaria<string>[];
  perfil: Perfil<string> | null;
}
```

Los campos parametrizados son los de la tabla de la SPEC 13: `Experiencia.descripcion`, `Hito.descripcion`, `Formacion.titulo/institucion`, `Extra.descripcion`, `FormacionComplementaria.titulo/institucion` `Perfil.descripcion/direccion/disponibilidad/idiomas[].idioma/idiomas[].nivel` y, por la enmienda, `Conocimiento.titulo`. Los payloads usan siempre `TextoLocalizado`.

```ts
export enum ConocimientoPrioridad {
  MUY_ALTA = 'muyAlta',
  ALTA = 'alta',
  MEDIA = 'media',
  BAJA = 'baja',
  MUY_BAJA = 'muyBaja',
}

// Solo admin
export const ETIQUETAS_PRIORIDAD: Record<ConocimientoPrioridad, string> = {
  muyAlta: 'Muy alta',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
  muyBaja: 'Muy baja',
};
```

## i18n

```ts
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es.json';
import en from './locales/en.json';

// Recursos en el bundle: el init es síncrono y el prerender pinta ya traducido.
i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng: 'es',
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
});

export default i18n;
```

- Se importa en `index.tsx` y en `entry-server.tsx` antes del `Router`.
- Las claves se agrupan por zona (`curriculum.tabs.experiencia`, `curriculum.vacio.experiencia`, `experiencia.tecnologias`, `fechas.actualidad`, `pdf.*`, `resumen.verMas`, `error.titulo`, `idioma.selector`…).
- Tipado de claves con `declare module 'i18next'` (`CustomTypeOptions` con `resources` de `es.json`): una clave que falte en `es` no compila. Un test comprueba que `es.json` y `en.json` tienen las mismas claves.
- Helpers fuera de React (`rangoFechas`, `metasCurriculum`, PDF) reciben un `t` (`i18n.getFixedT(idioma)`) como parámetro, en vez de importar el singleton.

## Rutas e idioma

- `Router`: añadir `<Route path="/en" element={<Curriculum />} />`.
- Hook `useIdioma(): Idioma`: devuelve `'en'` si `pathname` es `/en` o empieza por `/en/`, y `'es'` en otro caso.
- En `Curriculum`, un `useEffect` sobre `idioma` llama a `i18n.changeLanguage(idioma)` y pone `document.documentElement.lang = idioma`. Para que el primer render (y la hidratación) ya salga en el idioma correcto, `index.tsx` y `entry-server.tsx` hacen `changeLanguage` **antes** de renderizar.
- Selector (componente `SelectorIdioma`, en la cabecera del CV junto al botón PDF): dos `<Link>` (`/` y `/en`) con `hrefLang` y `lang`, y `aria-current="page"` en el activo. Al ser enlaces, los rastreadores los siguen.

## Store

- `curriculumSlice`: `curriculum: Curriculum | null` pasa a `curriculums: Record<Idioma, Curriculum | null>`. `setCurriculum` recibe `{ idioma, curriculum }`.
- `useCurriculumStore(idioma)` devuelve `curriculum` = `curriculums[idioma]` y `getCurriculum()` hace `api.get('/curriculum', { params: { lang: idioma } })`.
- Al cambiar de idioma, si el otro ya está en el store, se muestra al momento. Si no, se carga con el spinner de siempre.
- `window.__CURRICULUM__` pasa a `{ idioma, curriculum }`. `index.tsx` hidrata solo si `pathname` es `/` o `/en` y el idioma precargado coincide con el de la ruta. El refresco en segundo plano usa ese `lang`.

## Prerender

`scripts/prerender.mjs` renderiza los dos idiomas:

| Idioma | Petición                  | Salida               |
| ------ | ------------------------- | -------------------- |
| `es`   | `GET /curriculum?lang=es` | `dist/index.html`    |
| `en`   | `GET /curriculum?lang=en` | `dist/en/index.html` |

- `render(curriculum, idioma)` en `entry-server.tsx`: `changeLanguage(idioma)`, `setCurriculum({ idioma, curriculum })` y `StaticRouter location={idioma === 'en' ? '/en' : '/'}`. Los dos renders van seguidos en el mismo proceso, y como `renderToString` es síncrono, el singleton del store no molesta.
- Nuevo marcador `html: /<html lang="[^"]*">/`, que se sustituye por el idioma de la página.
- `metasCurriculum(perfil, siteUrl, idioma)` añade a `MetasCurriculum`:
  - `url`: `${siteUrl}/` o `${siteUrl}/en`.
  - `locale`: `es_ES` / `en_GB`, y `localeAlternativo` con el otro (`og:locale:alternate`).
  - `alternativos`: `[{ hreflang: 'es', href: siteUrl/ }, { hreflang: 'en', href: siteUrl/en }, { hreflang: 'x-default', href: siteUrl/ }]`.
- `etiquetasMeta` emite `<link rel="canonical">` y un `<link rel="alternate" hreflang>` por alternativo, en las dos páginas.
- `dist/spa.html` sigue siendo la carcasa vacía del resto de rutas.

`vercel.json`:

```json
{
  "rewrites": [
    { "source": "/en", "destination": "/en/index.html" },
    { "source": "/(.*)", "destination": "/spa.html" }
  ]
}
```

## Formularios del admin

Nuevo componente `components/CampoLocalizado.tsx`:

```tsx
interface Props {
  id: string; // "titulo" → inputs "titulo-es" y "titulo-en"
  etiqueta: string; // "Título"
  valor: TextoLocalizado;
  onChange: (valor: TextoLocalizado) => void;
  multilinea?: boolean; // textarea en vez de input
  required?: boolean; // solo afecta a ES
}
```

- Muestra «Título (ES)» y «Título (EN)», y junto a EN un botón «Sugerir EN».
- «Sugerir EN» está deshabilitado si ES está vacío o hay una traducción en curso. Llama a `POST /traduccion` con `{ textos: [es] }` y escribe el resultado en EN. Si EN ya tenía texto, lo sobrescribe: el usuario lo pidió y puede editarlo después.
- Mientras traduce, el botón dice «Traduciendo…». Si falla, aparece un mensaje en línea según el código (`429` «Cuota de traducción agotada», `503` «Traducción no disponible», otro «No se pudo traducir»), sin pasar por `MensajeAccion`, que es del envío del form.
- Hook `useTraduccion()`: `traducir(textos: string[]): Promise<string[]>`, con `traduciendo` y `error`.

Uso por formulario:

| Form                          | Campos con `CampoLocalizado`                              |
| ----------------------------- | --------------------------------------------------------- |
| `ExperienciaForm`             | `descripcion` (multilínea)                                |
| `FormacionForm`               | `titulo`, `institucion`                                   |
| `FormacionComplementariaForm` | `titulo`, `institucion`                                   |
| `PerfilForm`                  | `descripcion` (multilínea), `direccion`, `disponibilidad` |
| `ConocimientoForm`            | `titulo` (enmienda)                                       |

Listas (hitos, extras, idiomas del perfil): cada fila tiene un input ES y otro EN (`aria-label` «Hito N (ES)» / «Hito N (EN)»). Debajo del grupo, un botón «Sugerir EN de los vacíos» traduce **en una sola petición** todas las filas con ES relleno y EN vacío.

- Al editar, el form carga `{ es, en }` tal cual. `FORMACION_VACIA` y equivalentes usan `{ es: '', en: '' }`.
- Payload: los dos idiomas trimados. Se descartan las filas de hitos/extras/idiomas con `es` vacío.
- `ConocimientoForm`: el `<select>` usa las claves como `value` y `ETIQUETAS_PRIORIDAD` como texto.
- Cards (`ExperienciaCard`, `FormacionCard`, `FormacionComplementariaCard`): muestran el `es` y una marca «Sin EN» si algún campo localizado de la entidad (o de sus hitos/extras) tiene `en` vacío. Sirve para encontrar lo que falta por traducir.
- Conocimiento (enmienda):
  - `ConocimientoForm` usa `CampoLocalizado` para `titulo` (obligatorio en ES, con «Sugerir EN»). `CONOCIMIENTO_VACIO` usa `{ es: '', en: '' }` y el payload envía los dos idiomas trimados.
  - `ConocimientoCard` muestra `titulo.es` y **no** pinta «Sin EN»: en conocimiento el inglés es opcional a propósito (la mayoría son nombres propios) y la marca saldría en casi todas las cards.
  - Donde el admin pinta títulos de conocimiento (`MultiSelect` de `ExperienciaForm` y tecnologías de `ExperienciaCard`) se usa `titulo.es`.
  - `tecnologiasFilter` pasa a genérico (`<C extends { id: string }>`) para servir al admin (`Conocimiento`) y al CV (`Conocimiento<string>`).
  - La parte pública no cambia: `/curriculum?lang=` ya devuelve `titulo` resuelto, y `ordenarCurriculum`, `ConocimientoItem` y el PDF siguen trabajando con strings.

## Plan de implementación

1. **Tipos y prioridad.** `idioma.interface.ts`, interfaces parametrizadas y enum por claves. `npm run typecheck` señala todo lo que hay que tocar. Prueba: el typecheck compila tras los pasos 2–6.
2. **i18n.** `npm i i18next react-i18next`. Crear `src/i18n` con `es.json` (los textos actuales) y `en.json`. Sustituir los textos fijos de la parte pública por `t(...)`. Prueba: los tests del CV siguen pasando en español.
3. **Ruta, selector y store.** `useIdioma`, `/en`, `SelectorIdioma` y el slice por idioma. Prueba manual: `/en` muestra los textos fijos en inglés y el contenido con fallback a ES.
4. **PDF y helpers.** `rangoFechas`, `CurriculumPDF` y el nombre del fichero reciben `t`/`idioma`. Prueba: el PDF exportado desde `/en` sale en inglés.
5. **Prerender y Vercel.** `render(curriculum, idioma)`, marcador `html`, metas con `hreflang`/`canonical` y salida en `dist/en/index.html`. Prueba: tras `npm run build`, `dist/en/index.html` tiene `lang="en"`, contenido en inglés y las tres etiquetas `alternate`, y `npm run preview` hidrata sin avisos en `/` y `/en`.
6. **Admin.** `useTraduccion`, `CampoLocalizado`, filas bilingües, «Sugerir EN de los vacíos», cards con «Sin EN» y select de prioridad. Prueba manual contra el backend local con `DEEPL_API_KEY`.
7. **Tests:**
   - `es.json` y `en.json` con las mismas claves.
   - `useIdioma`: `/` → `es`, `/en` → `en`, `/experiencia` → `es`.
   - `Curriculum` en `/en`: textos fijos en inglés, `lang=en` en la petición y el selector marca EN.
   - `useCurriculumStore`: guarda por idioma y no vuelve a pedir el idioma que ya tiene.
   - `metasCurriculum`: `url`, `locale` y `alternativos` por idioma.
   - `rangoFechas` con `t` en inglés.
   - `CampoLocalizado`: «Sugerir EN» deshabilitado con ES vacío, rellena EN con la respuesta mockeada y muestra el error con `429`/`503`.
   - Forms: el payload lleva `{ es, en }`, la edición carga los dos idiomas y «Sugerir EN de los vacíos» manda una sola petición solo con las filas sin EN.
   - Cards: «Sin EN» aparece con `en` vacío y no aparece si todo está traducido.
   - `ordenarCurriculum` y PDF con las nuevas claves de prioridad.
8. `npm run verify`.
9. **Despliegue.** Justo después de la SPEC 13 en producción. Prueba: `/` y `/en` en producción, `curl` de `/en` con el HTML prerenderizado en inglés, y validar `hreflang` con un inspector SEO.
10. **Enmienda: `Conocimiento.titulo`.** Va después del paso 10 de la SPEC 13 (backend) en la misma rama, y antes del despliegue del paso 9.
    - Tipos: `Conocimiento<T>` y `Curriculum.conocimiento: Conocimiento<string>[]`; `tecnologiasFilter` genérico.
    - Admin: `ConocimientoForm` con `CampoLocalizado`; `ConocimientoCard`, `MultiSelect` y `ExperienciaCard` con `titulo.es`.
    - Tests: el payload de conocimiento lleva `{ es, en }`, la edición carga los dos idiomas, «Sugerir EN» rellena `titulo` EN, la card muestra el ES y no pinta «Sin EN», y el `MultiSelect` y la card de experiencia muestran el ES. Adaptar los fixtures de conocimiento del admin.
    - Prueba: `npm run verify` en verde y, contra el backend local migrado, `/en` muestra el `en` de un conocimiento traducido y el `es` de los demás.

## Criterios de aceptación

- [ ] `/` muestra el CV en español y `/en` en inglés: textos fijos con i18next y contenido de `/curriculum?lang=`.
- [ ] Un campo sin `en` se muestra en español dentro de `/en`, sin huecos.
- [ ] El selector ES | EN son enlaces con `hrefLang`, marca el idioma activo y cambia de idioma sin recargar.
- [ ] Volver a un idioma ya cargado no lanza otra petición.
- [ ] `dist/index.html` y `dist/en/index.html` salen prerenderizados, con `<html lang>`, `canonical`, `og:locale`, `og:url` y `hreflang` `es`/`en`/`x-default` correctos.
- [ ] En producción, `/en` sirve `dist/en/index.html` (no `spa.html`) e hidrata sin avisos.
- [ ] El PDF y su nombre de fichero salen en el idioma de la página.
- [ ] Los formularios editan ES y EN de cada campo de la tabla y envían `{ es, en }`.
- [ ] «Sugerir EN» rellena EN con la respuesta de `/traduccion`, está deshabilitado con ES vacío y muestra los errores `429`/`503`/otros.
- [ ] «Sugerir EN de los vacíos» hace una sola petición y solo toca las filas con EN vacío.
- [ ] Las cards marcan «Sin EN» las entidades con alguna traducción pendiente.
- [ ] La prioridad se guarda con claves y se muestra con su etiqueta en español en el admin.
- [ ] `ConocimientoForm` edita `titulo` en ES y EN con «Sugerir EN» y envía `{ es, en }`; en `/en` un conocimiento con `en` sale en inglés y uno sin `en` sale en español (enmienda).
- [ ] `es.json` y `en.json` tienen las mismas claves (test).
- [ ] `npm run verify` en verde.

## Decisiones

- **Sí:** idioma en la URL (`/en`). **No:** idioma solo en `localStorage` o en el estado, porque `hreflang` y el prerender necesitan URLs distintas.
- **Sí:** `/` para el español, sin `/es`. Mantiene la URL actual y los enlaces ya compartidos.
- **Sí:** recursos en el bundle e init síncrono. **No:** `i18next-http-backend`: el prerender no puede esperar a cargar los JSON y son pocos textos.
- **No:** detectar el idioma del navegador ni redirigir: un reclutador con el navegador en inglés que reciba el enlace `/` vería un CV distinto del enviado, y Google desaconseja redirigir por idioma.
- **Sí:** traducir solo la parte pública. El admin es de uso personal.
- **Sí:** un currículum por idioma en el store, para cambiar de idioma al momento al volver.
- **Sí:** entidades genéricas `<T = TextoLocalizado>`. **No:** duplicar interfaces (`Experiencia` / `ExperienciaCV`).
- **Sí:** «Sugerir EN» sobrescribe EN sin confirmar, porque es una acción explícita. **No:** un `confirm()`, que bloquea y no encaja con el resto del admin.
- **Sí:** para las listas, un botón por grupo y una sola petición. **No:** un botón por fila, que recarga la UI y gasta más peticiones.
- **Sí:** `t` por parámetro en helpers y PDF. **No:** importar el singleton de i18n en helpers puros, porque complica los tests.
- **Sí (enmienda):** `Conocimiento.titulo` bilingüe con `en` opcional y sin marca «Sin EN» en su card. **No:** marcar «Sin EN» en conocimiento, porque con nombres propios (React, Docker) el `en` vacío es lo normal y no algo pendiente.

## Riesgos

| Riesgo                                                                                   | Mitigación                                                                                                          |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| La hidratación no cuadra si el idioma de i18n no está fijado antes del primer render     | `changeLanguage` en `index.tsx`/`entry-server.tsx` antes de renderizar; prueba con `npm run preview` en `/` y `/en` |
| Vercel sirve `spa.html` en `/en` por la regla comodín                                    | Rewrite explícito `/en` → `/en/index.html` antes del comodín; comprobarlo con `curl` tras desplegar                 |
| `vite preview` no lee `vercel.json`                                                      | `index.tsx` comprueba la ruta y el idioma precargado antes de hidratar, como hoy                                    |
| Una clave de i18n en `en.json` pero no en `es.json` (o al revés)                         | Tipado de claves y test de paridad                                                                                  |
| Traducir las cadenas del PDF descuadra el maquetado (el inglés es más corto o más largo) | Revisión visual del PDF en los dos idiomas en el paso 4                                                             |
| Despliegue desfasado con el backend                                                      | Desplegar justo después de la SPEC 13; el fallback a `es` del backend cubre los datos aún sin traducir              |

## Enmiendas

| Fecha      | Cambio                                                                                                                                                                                | Motivo                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 2026-11-03 | `Conocimiento.titulo` bilingüe: tipo genérico, `ConocimientoForm` con `CampoLocalizado`, títulos ES en el admin, `tecnologiasFilter` genérico, paso 10 del plan, criterio y decisión. | Algunos conocimientos necesitan versión en inglés en `/en`. Acompaña a la enmienda de la SPEC 13 del backend. |
