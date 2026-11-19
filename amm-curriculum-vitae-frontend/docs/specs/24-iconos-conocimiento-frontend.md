# SPEC 24 — Iconos de conocimientos: pestaña `Conocimientos` y «Buscar icono» en el formulario

> **Estado:** Implementada
> **Depende de:** SPEC 14 del backend (`14-iconos-conocimiento.md`, Borrador), que añade `Conocimiento.icono` y `GET /api/icono?q=`; SPEC 23 (`23-version-ingles-i18n.md`), que fija `titulo: { es, en }` y el patrón de `useTraduccion`
> **Fecha:** 2026-11-18
> **Objetivo:** Mostrar el icono SVG de cada conocimiento a la izquierda de su nombre en la pestaña `Conocimientos` de `Curriculum`, y permitir en `ConocimientoForm` buscarlo por nombre («Buscar icono»), elegirlo de una lista, pegarlo a mano o quitarlo.

## Situación de partida

- `Conocimiento<T>` tiene `id`, `titulo` y `prioridad`. `ConocimientoPayload = Omit<Conocimiento, 'id'>`.
- `ConocimientoItem` pinta `<li className={styles.Item}><span className={styles.titulo}>…</span></li>`. `.Item` es `flex-direction: column`.
- `ConocimientoForm` tiene `CampoLocalizado` de título y el `<select>` de prioridad.
- `useTraduccion` es el patrón de llamada auxiliar del admin (`traduciendo`, `error`, mensajes por status).
- `CurriculumPDF` pinta `Competencias` con los títulos.

## Alcance

**Dentro:**

- **Interfaz** (`conocimiento.interface.ts`): `icono?: string` en `Conocimiento`. Opcional por robustez durante el despliegue (backend antiguo sin campo). Nuevo tipo `ResultadoIcono { nombre: string; fuente: 'simple-icons' | 'lucide' | 'monograma'; icono: string }`.
- **Nuevo componente `components/IconoSvg.tsx`** (+ `.module.scss`):
  - Props: `svg: string`, `className?`.
  - Pinta un `<span aria-hidden="true">` con `mask-image` / `-webkit-mask-image: url("data:image/svg+xml,<encodeURIComponent(svg)>")`, `background-color: currentColor`, `mask-size: contain`, sin repetición, centrado. Tamaño por defecto `1.5em` cuadrado.
  - `svg` vacío → no pinta nada (`null`).
  - Nunca usa `dangerouslySetInnerHTML`.
- **`ConocimientoItem`**: si hay `icono`, pinta `<IconoSvg>` antes del título dentro de una fila (`display: flex; align-items: center; gap: 0.6rem`, modificador nuevo en `Items.module.scss`, p. ej. `.conIcono`). Sin icono, el marcado y el aspecto quedan como hoy. Color: el del título (`currentColor`).
- **`ConocimientoForm`**, bloque nuevo `Icono` entre título y prioridad:
  - **Vista previa**: `IconoSvg` a ~2.5rem, o el texto `Sin icono`.
  - **Botón `Buscar icono`** (componente `Button`): llama a `GET /icono?q=<titulo.es>`. Deshabilitado si `titulo.es.trim()` está vacío o hay búsqueda en curso (`Buscando…`).
  - **Resultados**: rejilla de botones (`type="button"`), uno por resultado, con su `IconoSvg` y `aria-label="Usar icono {nombre} ({fuente})"`. Clic → `icono` = ese SVG y se cierra la lista. El seleccionado se marca (`aria-pressed`).
  - **`<textarea id="icono">`** (etiqueta `SVG:`), plegada en un `<details>` «Editar SVG a mano», para pegar o retocar el SVG.
  - **Botón `Quitar icono`**: `icono = ''`. Deshabilitado sin icono.
  - **Errores** (`role="alert"`, mismo estilo que `CampoLocalizado`): `502` → `Servicio de iconos no disponible`; resto → `No se pudo buscar el icono`. Un `400` del guardado (SVG inválido) llega por el `MensajeAccion` actual.
  - `CONOCIMIENTO_VACIO` incluye `icono: ''`; en edición carga `conocimientoEnEdicion.icono ?? ''`; «Borrar formulario» limpia icono y resultados.
  - El payload de `POST` / `PUT` siempre lleva `icono` (`''` si no hay), con `trim`.
- **Nuevo hook `hooks/useBuscarIcono.ts`**: `{ buscar(q): Promise<ResultadoIcono[]>, buscando, error }`, mismo patrón que `useTraduccion`.
- **Tests** (Vitest): ver plan.

**Fuera de alcance (para futuras specs):**

- Todo el backend (modelo, validación, búsqueda, carga inicial). Va en la SPEC 14 del backend.
- **Iconos en el PDF** (`CurriculumPDF` no cambia).
- Iconos en `ConocimientoCard` (admin), en las tecnologías de `ExperienciaItem` o en el multiselect de `ExperienciaForm`.
- Colores de marca: todos monocromos.
- Subir un fichero `.svg` desde disco (se pega en la textarea).
- Buscar por el título en inglés.

## Modelo de datos

```ts
export interface Conocimiento<T = TextoLocalizado> {
  id: string;
  titulo: T;
  prioridad: ConocimientoPrioridad;
  icono?: string; // SVG como texto; '' o ausente = sin icono
}

export interface ResultadoIcono {
  nombre: string;
  fuente: 'simple-icons' | 'lucide' | 'monograma';
  icono: string;
}
```

Payload del formulario:

```json
{
  "titulo": { "es": "React", "en": "React" },
  "prioridad": "alta",
  "icono": "<svg viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\">…</svg>"
}
```

Respuesta de `GET /icono?q=React`: `{ "resultados": ResultadoIcono[] }` (≤ 9, el último siempre `monograma`).

## Plan de implementación

1. **Interfaz.** `icono?` y `ResultadoIcono`. `tsc` en verde.
2. **`IconoSvg`.** Componente y estilos. Prueba (`test/components/IconoSvg.test.tsx`): con SVG pinta un `span` `aria-hidden` cuyo `style` contiene `data:image/svg+xml,` y el SVG codificado; con `''` no pinta nada; un SVG con `<script>` no crea ningún nodo `script` en el DOM.
3. **`ConocimientoItem` y pestaña.** Prueba (`Curriculum.test.tsx`): un conocimiento con icono pinta `IconoSvg` antes del título; uno sin icono no pinta `span` vacío ni cambia el marcado. El PDF (`CurriculumPDF.test.tsx`) no contiene nada de iconos.
4. **`useBuscarIcono`.** Prueba (`test/hooks`): éxito devuelve `resultados`; `502` y otros errores dejan el mensaje y relanzan; `buscando` vuelve a `false`.
5. **Formulario.** Bloque `Icono`. Pruebas (`Conocimiento.test.tsx` / `ConocimientoForm`):
   - `Buscar icono` deshabilitado con título ES vacío; llama a `/icono?q=React` con el título ES.
   - Elegir un resultado actualiza la vista previa y el `POST` lleva ese `icono`.
   - Pegar en la textarea actualiza la vista previa.
   - `Quitar icono` envía `icono: ''`.
   - Editar carga el icono existente; `Borrar formulario` lo limpia junto con los resultados.
   - Error `502` muestra `Servicio de iconos no disponible`.
6. `npm run verify` en verde.
7. **End to end** contra el backend local con la SPEC 14 y `npm run iconos`: la pestaña muestra los 42 iconos alineados a la izquierda en móvil y escritorio, en `/` y `/en`; buscar `React`, `SCRUM` y `Sonata` desde el formulario devuelve resultados (al menos el monograma); el PDF descargado no cambia.
8. **Producción.** Desplegar tras el backend de la SPEC 14 y la carga de iconos; revisar el prerender (`/` y `/en`) y el tamaño del HTML.

## Criterios de aceptación

- [ ] En la pestaña `Conocimientos`, cada conocimiento con icono lo muestra a la izquierda del nombre, del color del texto, alineado verticalmente.
- [ ] Un conocimiento sin icono se ve igual que hoy.
- [ ] Los iconos se pintan con máscara CSS; `src` no usa `dangerouslySetInnerHTML` para iconos.
- [ ] El icono es decorativo (`aria-hidden`); el nombre sigue siendo el texto accesible.
- [ ] El PDF no muestra iconos y su salida no cambia.
- [ ] El formulario muestra vista previa, `Buscar icono`, la lista de resultados, la edición manual y `Quitar icono`.
- [ ] `Buscar icono` usa el título ES y está deshabilitado sin título o mientras busca.
- [ ] Elegir, pegar o quitar un icono se refleja en la vista previa y en el payload.
- [ ] Editar carga el icono guardado; `Borrar formulario` lo limpia.
- [ ] Errores de búsqueda visibles con `role="alert"`; un SVG rechazado por el backend se informa con `MensajeAccion`.
- [ ] `npm run verify` y la cobertura en verde.

## Decisiones

- **Sí:** máscara CSS (`mask-image` + `currentColor`). Iconos monocromos coherentes entre Simple Icons, Lucide y monograma, heredan el color del tema y el SVG no se ejecuta nunca. **No:** `dangerouslySetInnerHTML` (XSS) ni `<img>` (no hereda color).
- **Sí:** icono a la izquierda del nombre, solo en la pestaña `Conocimientos`. **No:** en el PDF (`@react-pdf/renderer` no admite SVG en `Image`) ni en tecnologías de experiencia.
- **Sí:** búsqueda por el título ES (el que se rellena primero). El backend traduce si lo necesita.
- **Sí:** lista de resultados para elegir. **No:** asignar el primero automáticamente: los nombres conceptuales (`DDD`, `BI`) dan coincidencias dudosas.
- **Sí:** edición manual del SVG plegada: casos raros (logo descargado de la web oficial) sin estorbar el flujo normal.
- **Sí:** `icono` opcional en la interfaz, por robustez durante el despliegue.
- **No:** icono en `ConocimientoCard`: la vista previa del formulario basta; se puede añadir después.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| `mask-image` sin prefijo en navegadores antiguos | Se declaran `mask-*` y `-webkit-mask-*` |
| El prerender incrusta los SVG en el HTML (~42 × 1–5 KB) | Aceptable (~60 KB sin comprimir, mucho menos con gzip); revisar el tamaño en el paso 8 |
| Icono en los iconos de trazo (Lucide) más fino que los de relleno (Simple Icons) | Mismo tamaño en caja; ajustar visualmente en el paso 7 si desentona |
| Desplegar el frontend antes del backend | `icono` ausente → sin icono; la búsqueda devuelve `404` → `No se pudo buscar el icono` |
