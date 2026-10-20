# SPEC 19 — PDF con texto real, enlaces y maquetación pensada para reclutadores

> **Estado:** Implementada
> **Depende de:** SPEC 10 (`10-export-pdf-curriculum.md`, Implementada), que creó `CurriculumPDF` y `exportToPDF` basados en html2canvas y que esta spec sustituye; SPEC 18 (`18-enlaces-contacto.md`, Aprobada), que aporta `linkedinURL` y `githubURL` en `Perfil` (el PDF los pinta si existen); SPEC 15 (`15-expandable.md`), de la que se retiran restos específicos del PDF
> **Fecha:** 2026-10-19
> **Objetivo:** Que el botón `Descargar CV (PDF)` genere con `@react-pdf/renderer` un PDF de texto real (seleccionable, buscable y legible por ATS), con metadatos, enlaces pulsables y una maquetación de 2 páginas máximo con cortes limpios, en lugar de la captura de imagen actual.

## Situación de partida

- `exportToPDF.ts` captura el nodo oculto `CurriculumPDF` con html2canvas y lo inserta como JPEG en jsPDF. El fichero es una imagen por página: sin texto, sin enlaces, sin metadatos (solo `Producer: jsPDF`). Ver `CAMBIOS_Y_MEJORAS.md` §1.5 y §2.8.
- `calcularCortesPDF.ts` y los atributos `data-pdf-con-siguiente` existen solo para decidir dónde cortar la imagen.
- `Curriculum.tsx` monta `<CurriculumPDF>` oculto (`.pdfOculto`, `left: -10000px`) cuando `preparandoPDF` es `true` y llama a `exportToPDF(pdfRef.current, nombrePDF)`.
- `CurriculumPDF` reutiliza `ExperienciaItem` (con `enPDF`, `expandible={false}`) y `Contacto` con SCSS, y pinta dos columnas: foto/contacto/41 conocimientos a la izquierda; nombre, descripción y secciones a la derecha. Ocupa 3 páginas, con Everis y las tecnologías de PcComponentes partidos entre páginas.
- `Perfil.descripcion` ya es el resumen profesional (commit `Incluir descripción`); en el PDF se pinta bajo el nombre con estilo de subtítulo.
- El botón se llama `Exportar a PDF`.

## Alcance

**Dentro:**

- **Dependencia**: se añade `@react-pdf/renderer` (versión compatible con React 19, a verificar con la documentación actual antes de instalar) y se retiran `html2canvas` y `jspdf`.
- **`CurriculumPDF` reescrito** en `@react-pdf/renderer` (`Document`, `Page`, `View`, `Text`, `Link`, `Image`, `StyleSheet`), sin SCSS. Se elimina `CurriculumPDF.module.scss`. Mantiene las mismas props (`perfil`, `experiencia`, `formaciones`, `formacionesComplementarias`, `conocimiento`), ya ordenadas desde `Curriculum`.
- **Maquetación A4 con barra lateral tintada, máximo 2 páginas con los datos actuales** (revisada tras ver el primer PDF real; ver "Decisiones"):
  1. **Barra lateral** (fondo `$color-primary-soft`, repetido en todas las páginas con un `View` `fixed` para no dejar huecos): foto redondeada (si hay), bloque de contacto con etiqueta + valor para dirección, teléfono (`tel:`), email (`mailto:`) y, si existen, LinkedIn y GitHub; y `Competencias clave`. Las URLs largas bajan su último tramo de la ruta a una segunda línea para no desbordar.
  2. **Columna principal**: nombre, `descripcion` como resumen y las secciones de experiencia y formación.
  3. `Competencias clave`: conocimientos de nivel `Avanzado` e `Intermedio`, como lista con viñetas bajo un rótulo por nivel, sin los de nivel `Básico`. Orden alfabético (el actual). Si un nivel queda vacío, no se pinta su rótulo; si ambos, no se pinta la sección.
  4. `Experiencia`: por cada puesto, bloque indivisible con **empresa en negrita + fechas a la derecha + cargo (`descripcion`)**; debajo, línea `Tecnologías:` con las tecnologías **en línea separadas por comas** (todas, orden alfabético actual, sin recorte) y la lista de hitos con viñeta.
  5. `Formación Académica` y `Formación Complementaria`: una línea por registro, título en negrita y `(institución - fecha)` como hoy; el paréntesis se omite entero si no hay datos.
- **Cortes de página**: el bloque empresa + cargo + fechas + línea de tecnologías no se parte (`wrap={false}`); un título de sección nunca queda solo al final de página (`minPresenceAhead`); los hitos no se parten a mitad de viñeta.
- **Pie fijo en todas las páginas**: `{nombre} {apellidos} · Página X de Y`, para que las hojas sueltas sean identificables.
- **Tipografía unificada**: fuente integrada `Helvetica` (cubre acentos y eñe); un solo cuerpo de texto base; negrita solo para nombre, empresa, títulos de sección y titulación; color primario de la web (`$color-primary`) en títulos de sección.
- **Texto real y metadatos**: `Document` con `title` (`tituloCurriculum(perfil)`), `author` (nombre y apellidos), `subject` (`descripcion` recortada como en `metasCurriculum`), `language="es"`, `creator`/`producer` propios en lugar de jsPDF.
- **Enlaces pulsables y visibles**: `mailto:`, `tel:`, LinkedIn y GitHub. Las URLs de LinkedIn y GitHub se escriben además en texto (sin `https://`), porque el PDF puede imprimirse. Si `linkedinURL`/`githubURL` están vacías o ausentes, la línea no se pinta.
- **Foto**: se descarga como `data:` URL (sin `Referer`, con `urlFoto`) antes de generar, igual que hacía `incrustarImagenesExternas`, y se pasa a `Image`. Si la descarga falla, el PDF se genera sin foto y sin error visible.
- **`exportToPDF` reescrito**: firma `exportToPDF(datos, nombreFichero)` con `datos` = las props de `CurriculumPDF`; importa `@react-pdf/renderer` de forma diferida (no entra en el bundle inicial), genera el `Blob` con `pdf(<CurriculumPDF …/>).toBlob()` y lo descarga como `{nombreFichero}.pdf` con un `<a download>` temporal. Misma regla de nombre que hoy (`CV {nombre} {apellidos}` / `CV`).
- **`Curriculum.tsx`**: se retiran `pdfRef`, el bloque `{preparandoPDF && <div className={styles.pdfOculto}>…}` y la clase `.pdfOculto`; el `useEffect` llama a `exportToPDF` con los listados ordenados. El estado `preparandoPDF` se mantiene para el spinner/botón deshabilitado actual, si lo hay.
- **Botón**: el texto pasa de `Exportar a PDF` a `Descargar CV (PDF)`, mismo icono `descarga`.
- **Limpieza de lo que solo existía para la imagen**: se eliminan `calcularCortesPDF.ts` y su test, los atributos `data-pdf-con-siguiente` de `ExperienciaItem`, la prop `enPDF` y su clase `.pdf` en `Items.module.scss` (y cualquier regla de `Items.module.scss` que solo la use). `ExperienciaItem` conserva `expandible`.
- **Tests** (Vitest): `CurriculumPDF` (qué texto contiene en función de los datos), `exportToPDF` (nombre de fichero, llamada a `pdf().toBlob`, descarga, foto que falla), helpers nuevos y ajuste de `Curriculum`/`Button` si el texto del botón aparece en ellos. `@react-pdf/renderer` se mockea en tests de DOM.

**Fuera de alcance (para futuras specs):**

- Cambios en la web pública: cabeceras de experiencia, enlaces en `Contacto`, pestañas, `Resumen`, secciones nuevas (SPEC 18, §1.1, §3.6 de `CAMBIOS_Y_MEJORAS.md`).
- Campo nuevo de peso/prioridad en tecnologías o selección de las "principales" por puesto (§2.2): por ahora van todas, en línea.
- Agrupación de conocimientos por categoría (Front-end, Back-end…) (§2.1): no hay campo `categoria` en el modelo.
- Sección `Idiomas`, línea de `Disponibilidad`, entrada "Formación y proyectos propios" (§1.4, §1.6, §2.5): son contenido o campos nuevos.
- Reescritura de los hitos con resultados y unificación de grafías (§1.4, §3.8): contenido, no código.
- Detalle de formación académica (Proyecto Fin de Grado, intensificación) en el PDF.
- Versión del PDF en inglés (§2.4).
- Fuente Sora incrustada: se usa Helvetica integrada.
- Generar el PDF en el backend o servir un PDF estático.
- Modo oscuro, previsualización del PDF o abrirlo en pestaña nueva.

## Modelo de datos

No hay persistencia nueva, ni cambios en el backend, ni interfaces de dominio nuevas. Se reutilizan `Perfil` (con `linkedinURL?` y `githubURL?` de la SPEC 18), `Experiencia`, `Formacion`, `FormacionComplementaria` y `Conocimiento`.

Tipo compartido por `CurriculumPDF` y `exportToPDF`:

```ts
export interface DatosCurriculumPDF {
  perfil: Perfil | null;
  experiencia: Experiencia[];
  formaciones: Formacion[];
  formacionesComplementarias: FormacionComplementaria[];
  conocimiento: Conocimiento[];
}
```

Helpers puros nuevos (testeables sin `@react-pdf`):

```ts
// Avanzado e Intermedio, cada uno como lista de títulos
export const competenciasClave = (
  conocimiento: Conocimiento[],
): { avanzado: string[]; intermedio: string[] };

// Descarga la foto sin Referer y la devuelve como data URL, o null si falla
export const fotoComoDataURL = (url: string): Promise<string | null>;
```

Estructura del documento:

| Zona               | Contenido                                                            |
| ------------------ | -------------------------------------------------------------------- |
| Barra lateral      | Foto, contacto con etiquetas y enlaces, `Competencias clave`         |
| Cabecera principal | Nombre y `descripcion`                                               |
| Experiencia        | Por puesto: empresa + cargo + fechas, `Tecnologías:` en línea, hitos |
| Formaciones        | Una línea por registro, título en negrita                            |
| Pie fijo           | `{nombre} {apellidos} · Página X de Y`                               |

## Plan de implementación

1. Instalar `@react-pdf/renderer` (comprobando compatibilidad con React 19 y con Vite/vitest) sin quitar aún html2canvas/jspdf. El sistema sigue funcionando igual.
2. Crear los helpers puros `competenciasClave` y `fotoComoDataURL` (este último extrae la lógica de descarga sin `Referer` de `exportToPDF`) con sus tests.
3. Escribir el nuevo `CurriculumPDF` (cabecera, competencias, experiencia, formaciones, pie fijo, metadatos, enlaces) en un fichero nuevo junto al actual, sin conectarlo todavía, con sus tests de contenido.
4. Reescribir `exportToPDF` con `pdf().toBlob()` y descarga, y adaptar `Curriculum.tsx` (sin nodo oculto ni `pdfRef`) y el texto del botón a `Descargar CV (PDF)`. Ajustar sus tests. A partir de aquí el flujo nuevo es el activo.
5. Eliminar `calcularCortesPDF.ts` y su test, la versión antigua de `CurriculumPDF` y su SCSS, `data-pdf-con-siguiente`, `enPDF` y `.pdf`, `.pdfOculto`, y desinstalar `html2canvas` y `jspdf`. Actualizar `README.md` donde los mencione.
6. Verificación final: `npm run verify`, `npm run build` y revisión manual de un PDF real (texto extraíble, enlaces, metadatos, 2 páginas, cortes).

## Criterios de aceptación

- [x] Al pulsar `Descargar CV (PDF)` se descarga `CV {nombre} {apellidos}.pdf`; sin perfil, `CV.pdf`.
- [x] El botón de la web muestra `Descargar CV (PDF)` y ya no existe el texto `Exportar a PDF` en `src/` ni en `test/`.
- [x] La extracción de texto del PDF (`pdftotext`) devuelve nombre, empresas, cargos, fechas, hitos, tecnologías y formaciones; el texto es seleccionable en un visor.
- [x] El PDF no contiene imágenes distintas de la foto de perfil.
- [x] Metadatos del PDF: `Title` = `{nombre} {apellidos} | Curriculum Vitae`, `Author` = nombre y apellidos, `Language` = `es`, `Producer` ≠ jsPDF.
- [x] El email es un enlace `mailto:`, el teléfono un enlace `tel:`, y con `linkedinURL`/`githubURL` informadas aparecen escritos y como enlaces pulsables; si no hay valor, no se pinta la línea.
- [x] Con los datos de producción actuales el PDF ocupa 2 páginas como máximo.
- [x] Ningún bloque empresa + cargo + fechas queda separado de su línea de tecnologías ni al pie de página sin su contenido; ningún título de sección queda solo al final de una página.
- [x] Todas las páginas llevan el pie `{nombre} {apellidos} · Página X de Y`.
- [x] `Competencias clave` solo contiene conocimientos de nivel `Avanzado` e `Intermedio`; ninguno `Básico`.
- [x] Las tecnologías de cada experiencia aparecen en una línea separada por comas, sin recortar (mismo número que hoy).
- [x] Si la foto no se puede descargar, el PDF se genera igualmente, sin foto.
- [x] Sin `perfil`, el PDF se genera con las secciones que haya, sin cabecera de nombre y sin pie de nombre.
- [x] `html2canvas`, `jspdf`, `calcularCortesPDF`, `data-pdf-con-siguiente`, `enPDF` y `pdfOculto` no aparecen en `src/`, `test/`, `package.json` ni `README.md`.
- [x] `@react-pdf/renderer` no está en el bundle inicial (solo en un chunk cargado al pulsar el botón) y `npm run build` (con prerender) termina sin errores.
- [x] `npm run verify` pasa (lint, typecheck, format, tests).

## Decisiones tomadas y descartadas

- **`@react-pdf/renderer`** frente a `@media print` + `window.print()` y a jsPDF con texto a mano. Es la única opción que da texto real, enlaces, metadatos propios y control de saltos de página de forma determinista; `window.print()` depende del navegador y no fija metadatos, y jsPDF obliga a calcular coordenadas y cortes a mano.
- **Barra lateral tintada** (decisión revisada: la versión inicial era de una sola columna, y el primer PDF real resultó plano y difícil de escanear frente al anterior). El problema de §2.8 (hueco vacío de la columna lateral en la página 2) se resuelve pintando el fondo de la barra con un `View` `fixed` en todas las páginas: si la lateral termina en la primera, la segunda conserva la franja de color. El contenido de la lateral va antes que el de la columna principal en el flujo del documento.
- **Conocimientos reducidos a `Competencias clave`** (Avanzado e Intermedio), sin tocar el modelo. Se descarta mantener los 41 (diluyen, §2.1) y quitarlos del todo (se pierden señales de nivel). Los de nivel Básico siguen apareciendo en las tecnologías de cada puesto si se usaron allí.
- **Tecnologías en línea, todas y en orden alfabético actual**, en vez de limitar a 8-10: no existe peso por tecnología y recortar sin criterio puede esconder palabras clave que busque un ATS. La priorización queda para una spec de modelo de datos.
- **Helvetica integrada** en lugar de registrar Sora: evita descargar y empaquetar fuentes y los problemas de carga en el navegador; se prioriza legibilidad y peso del fichero.
- **Generación en cliente y de forma diferida**: se mantiene el modelo actual (sin backend de PDF); el coste del paquete se paga solo al pulsar.
- **El botón pasa a `Descargar CV (PDF)`**: más claro para un visitante que `Exportar a PDF` (§1.5).
- **`ExperienciaItem` y `Contacto` dejan de usarse en el PDF**: `react-pdf` no renderiza HTML/SCSS, así que el PDF tiene su propia maquetación. Se acepta cierta duplicación de estructura a cambio de independizar PDF y web.

## Riesgos identificados

- **Pie fijo en `react-pdf`**: con `lineHeight` en el estilo de `Page`, o con `bottom` en un `Text` fijo con `render`, el pie no se pinta (los mocks de DOM no lo detectan). Se posiciona con `top` y sin `lineHeight` por encima; se comprueba siempre en un PDF real.
- **Compatibilidad de `@react-pdf/renderer` con React 19 y Vite**: versiones antiguas no soportan React 19 o necesitan polyfills (`Buffer`). Se comprueba en el paso 1 antes de escribir el resto; si falla, paramos la implementación y probamos a actualizar librerías.
- **Peso del paquete**: `@react-pdf/renderer` es grande. Se mitiga con `import()` diferido; se verifica en el build que no entra en el chunk inicial ni afecta al prerender (SSR).
- **Foto de Drive** (CORS/429 con `Referer`): se descarga sin `Referer` a `data:` URL y, si falla, se omite la foto.
- **Tests en jsdom**: `react-pdf` no renderiza en jsdom; los tests de contenido deben apoyarse en helpers puros y en mocks de `@react-pdf/renderer`. La comprobación del PDF real (texto, páginas, metadatos) es manual.
- **Dependencia de la SPEC 18**: si `linkedinURL`/`githubURL` aún no están en `Perfil` al implementar, hay que implementar primero esa parte de tipos o dejar los criterios de enlaces sociales pendientes.
- **Acentos y caracteres especiales con Helvetica**: cubre el latín básico y las tildes del español; símbolos fuera de WinAnsi (p. ej. `→`) se sustituirían por un carácter vacío. Se revisa el texto real en la verificación manual.
