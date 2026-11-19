# SPEC 14 — Icono SVG en Conocimiento y búsqueda de iconos

> **Estado:** Implementada
> **Depende de:** SPEC 11 (`11-prioridad-conocimiento.md`), que fija el `PUT` con campos opcionales; SPEC 13 (`13-contenido-bilingue.md`), que fija `titulo: { es, en }`, `resolverIdioma` y el patrón de `POST /api/traduccion`
> **Fecha:** 2026-11-18
> **Objetivo:** Guardar en cada `Conocimiento` un icono opcional como texto SVG validado, exponer `GET /api/icono?q=` (con JWT) para que el admin busque iconos por nombre en Simple Icons y Lucide (con monograma generado como último recurso) y cargar los iconos de los 42 conocimientos actuales.

## Alcance

**Dentro:**

- `models/Conocimiento.js`: campo nuevo `icono` (`String`, `default: ''`). No es localizado: `resolverIdioma` lo deja pasar tal cual.
- Nuevo `helpers/validarIcono.js`: normaliza y valida el SVG (ver «Validación»). Lanza `HttpError(400, 'Icono SVG no válido')`.
- `controllers/conocimiento.js`:
  - `crearConocimiento`: valida `req.body.icono` si viene.
  - `crearConocimientos`: valida el `icono` de cada elemento; si uno falla, `400` y no se inserta ninguno.
  - `actualizarConocimiento`: asigna `icono` solo si viene en el body (`!== undefined`), como `prioridad`. `''` quita el icono.
- Nuevo `GET /api/icono?q=<texto>` (`routes/icono.js`, `controllers/icono.js`, montado en `index.js`), con `validarJWT`.
- Nuevo `scripts/cargarIconosConocimientos.js` (`npm run iconos`): lee `scripts/data/iconosConocimientos.json` y asigna `icono` por `titulo.es`.
- Tests en `test/api/conocimiento.test.js`, nuevo `test/api/icono.test.js` y `test/helpers/validarIcono.test.js`.

**Fuera de alcance (para futuras specs):**

- Todo el frontend (formulario, pestaña `Conocimientos`). Va en la SPEC 24 del frontend.
- Iconos en el PDF.
- Iconos en otras entidades (experiencia, formación…).
- Generar iconos con IA (Claude API u otra).
- Sanear quitando nodos peligrosos: el SVG se rechaza entero (ver «Decisiones»).
- Guardar imágenes binarias o PNG.

## Modelo de datos

```js
icono: {
  type: String,
  default: '',
},
```

Contrato de entrada de `POST /api/conocimiento` y `PUT /api/conocimiento/:id`:

```json
{
  "titulo": { "es": "React", "en": "" },
  "prioridad": "alta",
  "icono": "<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"…\"/></svg>"
}
```

- `POST`: `icono` ausente → `''`.
- `PUT`: `icono` ausente → se conserva; `''` → se quita.
- `GET /api/conocimiento` y `GET /api/curriculum` devuelven `icono` en cada conocimiento.

### Validación (`helpers/validarIcono.js`)

`validarIcono(valor) → string`:

1. `undefined` / `null` / `''` → `''`.
2. No es `string` → `400`.
3. Normaliza: `trim`, quita el prólogo `<?xml …?>` y los comentarios `<!-- … -->`.
4. Rechaza (`400`) si:
   - supera `MAX_ICONO = 10000` caracteres;
   - no empieza por `<svg` ni termina en `</svg>`;
   - contiene (sin distinguir mayúsculas) `<script`, `<foreignObject`, `<iframe`, `<embed`, `<object`, `<image`, `<style`, `<!DOCTYPE`, `<!ENTITY`, `javascript:` o `data:`;
   - tiene algún atributo `on…=` (`/\son[a-z]+\s*=/i`);
   - tiene algún `href` o `xlink:href` que no empiece por `#`.
5. Devuelve el SVG normalizado.

El SVG mayor de los 42 iniciales ocupa ~5 KB, dentro del límite y del `express.json()` por defecto (100 KB).

## Búsqueda: `GET /api/icono?q=`

Con JWT. `q`: string de 1 a 100 caracteres tras `trim`; si no → `400`.

Fuentes (catálogos públicos vía jsDelivr, versiones fijadas en constantes):

| Fuente       | Catálogo                                                       | SVG                                                         | Licencia |
| ------------ | -------------------------------------------------------------- | ----------------------------------------------------------- | -------- |
| Simple Icons | `simple-icons@16.38.0/data/simple-icons.json` (title, slug, aliases) | `simple-icons@16.38.0/icons/<slug>.svg`                     | CC0      |
| Lucide       | `lucide-static@1.75.0/tags.json` (nombre → tags en inglés)     | `lucide-static@1.75.0/icons/<nombre>.svg`                   | ISC      |

Algoritmo:

1. **Términos.** Del `q` se sacan: el texto entero y cada palabra (separando por espacios, paréntesis, comas, `/`). Se normalizan a minúsculas sin acentos ni caracteres no alfanuméricos (`"IA ClaudeCode"` → `iaclaudecode`, `ia`, `claudecode`). Palabras de menos de 2 caracteres se descartan.
2. **Simple Icons (marcas).** Puntúa cada icono contra los términos normalizados: igual al `slug` o al `title` normalizado = 3; empieza por = 2; contiene (término ≥ 4 caracteres) = 1. También cuentan los `aliases`.
3. **Lucide (conceptos).** Si `DEEPL_API_KEY` existe, traduce `q` a inglés con el mismo cliente que `traduccion.js` (extraer `obtenerTraductor` a `helpers/deepl.js`); si falla o no hay clave, usa `q` tal cual. Puntúa contra el nombre del icono y sus tags (mismo esquema).
4. **Resultados.** Hasta 8: primero Simple Icons por puntuación, después Lucide. Se descargan sus SVG en paralelo, se normalizan (sin comentarios, `<title>` ni `class`) y se pasan por `validarIcono`; los que fallen se descartan.
5. **Monograma.** Siempre se añade al final un SVG generado con las iniciales de `q` (máx. 2 letras) sobre un cuadrado redondeado, en `viewBox="0 0 24 24"`. Así siempre hay algo que elegir.

Los catálogos se cachean en memoria del módulo (como `traductor`) tras la primera petición correcta.

Respuesta `200`:

```json
{
  "resultados": [
    { "nombre": "React", "fuente": "simple-icons", "icono": "<svg …>" },
    { "nombre": "atom", "fuente": "lucide", "icono": "<svg …>" },
    { "nombre": "RE", "fuente": "monograma", "icono": "<svg …>" }
  ]
}
```

Errores: `400` sin `q` válido; `401` sin token; `502` (`Error del servicio de iconos`) si fallan los dos catálogos. Si solo falla uno, se responde con el otro y el monograma.

## Carga de los conocimientos actuales

`scripts/data/iconosConocimientos.json` (ya creado) contiene los 42 conocimientos de producción a 2026-11-18:

```json
[{ "titulo": "React", "fuente": "Simple Icons", "slug": "react", "icono": "<svg …>" }]
```

`scripts/cargarIconosConocimientos.js` (mismo estilo de conexión que `seedUsuario.js`):

- Para cada entrada, `validarIcono(icono)` y `updateOne({ 'titulo.es': titulo }, { $set: { icono } })`.
- Informa de los títulos sin coincidencia y termina con el recuento (`actualizados / no encontrados`).
- Idempotente. Sobrescribe el icono existente.

## Plan de implementación

1. **Modelo y validador.** Campo `icono` y `helpers/validarIcono.js`. Prueba: tests unitarios del validador (casos válidos de Simple Icons y Lucide; cada patrón prohibido → `400`; longitud; prólogo y comentarios eliminados).
2. **Controlador de conocimiento.** Validar en `POST`, `POST /multiple` y `PUT`. Prueba: `PUT` sin `icono` lo conserva; con `''` lo quita; con `<script>` → `400` y el documento no cambia.
3. **Extraer cliente DeepL** a `helpers/deepl.js` y usarlo desde `traduccion.js`. Prueba: tests de traducción en verde sin cambios.
4. **Búsqueda.** `controllers/icono.js` + `routes/icono.js` + montaje en `index.js`. Tests con `fetch` mockeado (`vi.spyOn(globalThis, 'fetch')`) y DeepL mockeado:
   - `q` ausente, vacío o > 100 → `400`; sin token → `401`.
   - `q=React` → primer resultado `simple-icons` `React`; último `monograma`.
   - `q=Testing FrontEnd (Jest, Vitest)` → incluye `Jest` y `Vitest`.
   - `q=Microservicios` con DeepL mockeado a `Microservices` → resultados `lucide`.
   - Sin `DEEPL_API_KEY` → busca con `q` tal cual, sin error.
   - Un SVG descargado con `<script>` se descarta.
   - Falla un catálogo → `200` con el otro; fallan los dos → `502`.
   - Segunda petición no vuelve a descargar los catálogos.
5. **Script de carga.** `scripts/cargarIconosConocimientos.js` y `"iconos"` en `package.json`. Prueba: en local, 42 actualizados y 0 no encontrados.
6. `npm run verify`-equivalente: `npm run lint`, `npm run format:check`, `npm test`, `npm run test:coverage`.
7. **Producción.** Desplegar y ejecutar `npm run iconos` contra producción. Prueba: `GET /api/curriculum` devuelve `icono` no vacío en los 42. Después, frontend SPEC 24.

## Criterios de aceptación

- [ ] `POST` sin `icono` guarda `''`; con SVG válido lo guarda normalizado.
- [ ] `PUT` sin `icono` lo conserva; con `''` lo quita; con SVG válido lo sustituye.
- [ ] SVG con script, `on…=`, `href` externo, `<foreignObject>`, `<image>`, `<style>`, `DOCTYPE`/`ENTITY`, `javascript:`/`data:` o > 10 000 caracteres → `400 Icono SVG no válido` y nada se escribe.
- [ ] `POST /multiple` con un icono inválido no inserta ninguno.
- [ ] `GET /api/conocimiento` y `GET /api/curriculum?lang=es|en` incluyen `icono`.
- [ ] `GET /api/icono?q=` exige JWT, valida `q` y devuelve ≤ 9 resultados (8 + monograma), el monograma siempre el último.
- [ ] Todos los SVG devueltos por `/api/icono` pasan `validarIcono`.
- [ ] `/api/icono` funciona sin `DEEPL_API_KEY`.
- [ ] `npm run iconos` actualiza los 42 conocimientos en local y producción; repetirlo no cambia nada.
- [ ] Lint, formato, tests y cobertura (80 %) en verde.

## Decisiones

- **Sí:** SVG como texto en el propio documento. **No:** URL externa (se rompe, tracking), binario/base64 (pesado, prerender más grande), almacenamiento externo (servicio y credenciales extra en Vercel serverless).
- **Sí:** rechazar el SVG entero si tiene algo peligroso. **No:** sanear quitando nodos con regex (frágil) ni DOMPurify + jsdom (dependencia pesada en serverless). Las fuentes previstas (Simple Icons, Lucide) nunca traen nada de lo prohibido.
- **Sí:** defensa en profundidad: además, el frontend lo pinta como imagen (máscara CSS), nunca como HTML.
- **Sí:** búsqueda en el backend. **No:** desde el navegador: reusa DeepL (clave en servidor), valida con el mismo helper y el frontend no depende de CDNs.
- **Sí:** Simple Icons para marcas y Lucide para conceptos (`SCRUM`, `Microservicios`…), ambos monocromos y con licencia libre. **No:** Devicon/iconos a color: el frontend los pinta monocromos.
- **Sí:** DeepL para traducir la consulta a inglés antes de buscar en Lucide (tags en inglés), opcional.
- **Sí:** monograma generado como «crear icono» cuando no hay nada. **No:** generar con IA: coste y clave nuevos, resultado irregular; se puede abrir spec aparte.
- **Sí:** catálogos con versión fijada: resultados reproducibles y tests estables.
- **Sí:** script versionado con JSON para la carga inicial (son datos, no una orden única como en la SPEC 11). **No:** `mongosh` con 42 SVG pegados.
- **Sí:** `PUT` con `icono` ausente lo conserva (mismo criterio que `prioridad`).

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| jsDelivr caído o lento | Solo afecta a la búsqueda del admin; catálogos cacheados; `502` controlado; el monograma no depende de red |
| Un SVG malicioso supera el validador | Lista de rechazo amplia + el frontend nunca lo inyecta como HTML (`mask-image` en CSS no ejecuta scripts) |
| Cambio de títulos en producción antes de cargar | El script informa de los no encontrados; asignarlos a mano desde el formulario |
| Simple Icons retira una marca (p. ej. ya retiró Java y Oracle) | Versión fijada; el SVG ya está guardado en la base y no depende del catálogo |
| Marcas registradas en los logos | Uso nominativo en un CV personal; Simple Icons documenta las directrices de cada marca |
| Catálogo de Simple Icons (~460 KB) en cada arranque en frío de Vercel | Solo se descarga al buscar, no al arrancar |
