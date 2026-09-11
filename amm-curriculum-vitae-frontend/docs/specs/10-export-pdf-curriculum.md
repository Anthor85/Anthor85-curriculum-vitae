# SPEC 10 — Exportar el currículum completo a PDF

> **Estado:** Implementada
> **Depende de:** SPEC 09 del frontend (`09-curriculum-pestanas-y-contacto.md`, Implementada), que fija las pestañas, las tarjetas de solo lectura de `src/pages/curriculum/` y el bloque de contacto bajo la foto
> **Fecha:** 2026-09-01
> **Objetivo:** Que el botón `Export to PDF` genere un PDF a dos columnas —foto, contacto y conocimientos a la izquierda; nombre, descripción y las secciones Experiencia, Formación Académica y Formación Complementaria en columna a la derecha— con todo el contenido aunque no quepa en una página, y guardado como `CV {nombre} {apellidos}.pdf`.

## Alcance

**Dentro:**

- Nuevo componente `CurriculumPDF` (`src/pages/curriculum/CurriculumPDF.tsx` + `CurriculumPDF.module.scss`): maqueta de dos columnas pensada para papel, independiente de `Tabs`. Se exporta desde el barril `src/pages/curriculum/index.ts`.
- El nodo del PDF se renderiza **siempre montado y fuera de pantalla** (`position: absolute; left: -10000px; top: 0`) dentro de `MainPage`, con ancho fijo `794px` (A4 a 96 dpi). Nunca `display: none`: html2canvas mediría `0x0`.
- `MainPage.tsx` pasa a tener **dos refs**: el actual `exportableHTML` deja de usarse para exportar y se sustituye por `pdfRef`, que apunta al nodo oculto. El botón `Export to PDF` llama a `exportToPDF(pdfRef.current, nombreFichero)`.
- El PDF deja de depender de la pestaña activa: incluye siempre las tres secciones completas más los conocimientos, sin scroll ni recortes. Queda resuelta la limitación declarada fuera de alcance en la SPEC 09.
- `src/helpers/exportToPDF.ts` se reescribe: acepta un segundo parámetro `nombreFichero: string`, trocea el canvas en tantas páginas A4 verticales como haga falta y elimina el `console.log`, el `proxy` de `cors-anywhere` y el bloque comentado de `document.html`.
- Nombre del fichero: `CV {nombre} {apellidos}.pdf`. Si no hay perfil o ambos campos están vacíos, `CV.pdf`. El botón sigue habilitado en todos los casos.
- `Experiencia` y `Formación Académica` reutilizan sin cambios las tarjetas de la SPEC 09 (`ExperienciaItem`, `FormacionItem`), pero en el PDF se pintan sin fondo, sin borde y sin padding, con `1rem` de separación entre instancias.
- `Conocimientos` y `Formación Complementaria` **no** usan `ConocimientoItem` ni `FormacionComplementariaItem`: en el PDF van en texto plano compacto, una línea por registro, con el nombre en negrita — `**Nombre** (nivel)` y `**Nombre** (institución - fecha)`. El paréntesis se omite entero si no hay datos. Los dos componentes siguen intactos y en uso en las pestañas de `/`.
- El orden y la ordenación de los listados son los mismos que en pantalla (`experiencia` por `fechaInicio` desc; las dos formaciones por `fechaFin` desc; `conocimiento` en el orden del backend). La lógica de ordenación se extrae de `MainPage` a una función reutilizable para que pantalla y PDF no puedan divergir.
- Sección vacía en el PDF: **no se pinta ni su título**. En el PDF no aparecen los mensajes `Sin experiencia registrada` y equivalentes.
- Se marca `[x] Pasar a PDF la información de Curriculum` en `references/TODO.md`.

**Fuera de alcance (para futuras specs):**

- PDF con texto seleccionable o buscable: el resultado es una imagen por página, consecuencia directa de html2canvas.
- Evitar que una tarjeta se parta entre dos páginas (control de saltos por bloque).
- Numeración de páginas, cabecera o pie repetidos, marca de agua.
- Elegir formato u orientación (A4 vertical fijo), márgenes configurables o tamaño Carta.
- Indicador de progreso o botón deshabilitado mientras se genera el PDF.
- Previsualización del PDF antes de descargar, o abrirlo en pestaña nueva en vez de descargarlo.
- Generar el PDF en el backend.
- Exportar solo la pestaña activa: se elimina, no se conserva como segundo modo.
- Enlaces clicables dentro del PDF (`mailto:`, `tel:`, URLs).
- Las páginas de administración (`/experiencia`, `/formacion`, `/formacion-complementaria`, `/conocimiento`, `/perfil`), sus formularios y sus cards: no se tocan.
- El componente `Tabs` y la vista en pantalla de `MainPage`: salvo las dos refs y la extracción de la ordenación, no cambian.
- Responsive y vista móvil.
- Tests automatizados: el proyecto no tiene suite hoy.

## Modelo de datos

No hay persistencia nueva, ni cambios en el backend, ni interfaces nuevas de dominio. Se reutilizan `Curriculum`, `Perfil`, `Experiencia`, `Formacion`, `FormacionComplementaria` y `Conocimiento` tal como los fija la SPEC 09.

Props de `CurriculumPDF`:

```ts
interface Props {
  perfil: Perfil | null;
  experiencia: Experiencia[];
  formaciones: Formacion[];
  formacionesComplementarias: FormacionComplementaria[];
  conocimiento: Conocimiento[];
}
```

Los cinco listados llegan **ya ordenados** desde `MainPage`; `CurriculumPDF` no ordena.

Nueva firma del helper:

```ts
export const exportToPDF = (
  exportableHTML: HTMLDivElement,
  nombreFichero: string,
) => { ... };
```

Estructura del nodo exportable:

| Zona                     | Contenido                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Columna izquierda (~35%) | Foto (al 75% del ancho de columna, centrada), bloque de contacto (dirección, teléfono, email con sus iconos) y, debajo, el título `Conocimientos` con sus líneas de texto plano sangradas |
| Columna derecha (~65%)   | `nombre + apellidos`, `descripcion` y, en columna, las secciones `Experiencia`, `Formación Académica` y `Formación Complementaria`     |

Títulos de sección exactos: `Experiencia`, `Formación Académica`, `Formación Complementaria`, `Conocimientos`.

Troceado en páginas dentro de `exportToPDF`:

```
pdfWidth   = doc.internal.pageSize.getWidth()      // 210mm
pdfHeight  = doc.internal.pageSize.getHeight()     // 297mm
imgHeight  = canvas.height * pdfWidth / canvas.width
restante   = imgHeight
posicion   = 0
addImage(imgData, 'JPEG', 0, posicion, pdfWidth, imgHeight)
mientras (restante -= pdfHeight) > 0:
    posicion -= pdfHeight
    doc.addPage()
    addImage(imgData, 'JPEG', 0, posicion, pdfWidth, imgHeight)
```

Es decir: una sola imagen reutilizada y desplazada en negativo por página, la técnica habitual con jsPDF; no se recorta el canvas a mano.

## Plan de implementación

1. Reescribir `src/helpers/exportToPDF.ts`: segundo parámetro `nombreFichero`, opciones de html2canvas reducidas a `{ useCORS: true, scale: 2 }`, canvas volcado a JPEG con calidad `0.92` (`toDataURL('image/jpeg', 0.92)` y `addImage(..., 'JPEG', ...)`), troceado multipágina según el pseudocódigo, guardado como `` `${nombreFichero}.pdf` ``, sin `console.log`, sin `proxy` y sin el bloque comentado. Prueba: llamándolo desde el botón actual con el nodo actual, el PDF sigue descargándose y ya lleva el nombre pasado por parámetro.
2. Extraer la ordenación de `MainPage.tsx` a una función reutilizable (`tiempo` incluido) que devuelva los cuatro listados ordenados a partir de `curriculum`. Prueba: la vista en pantalla sigue mostrando el mismo orden que antes y `npx tsc --noEmit` está limpio.
3. Crear `src/pages/curriculum/CurriculumPDF.module.scss` con el contenedor de ancho `794px`, fondo blanco, las dos columnas, los títulos de sección, el modificador de sección plana (sin fondo ni borde, `1rem` entre instancias) y el bloque de líneas de texto plano. Prueba: montándolo temporalmente visible, se ve la maqueta a dos columnas con el ancho de una A4.
4. Crear `src/pages/curriculum/CurriculumPDF.tsx` con las props del modelo de datos, reutilizando `ExperienciaItem` y `FormacionItem`, pintando conocimientos y formación complementaria en texto plano, y usando `getIcons` para los iconos de contacto, sin pintar título de las secciones vacías. Exportarlo desde `index.ts`. Prueba: `npx tsc --noEmit` limpio y el componente renderiza con datos reales.
5. En `MainPage.tsx`, añadir `pdfRef` y renderizar `<div ref={pdfRef} className={styles.pdfOculto}><CurriculumPDF ... /></div>` fuera de pantalla, alimentado con los listados ordenados del paso 2. Prueba: el nodo existe en el inspector con `left: -10000px` y no altera el maquetado ni provoca scroll horizontal.
6. Añadir a `MainPage.module.scss` la regla `.pdfOculto` (`position: absolute; left: -10000px; top: 0`). Prueba: la página se ve exactamente igual que antes.
7. Cambiar el `onClick` del botón para que use `pdfRef` y calcule el nombre uniendo `perfil.nombre` y `perfil.apellidos` con un espacio, descartando los vacíos, con prefijo `CV ` y respaldo `CV` cuando no queda nada. Prueba: el PDF descargado se llama `CV Antonio Macián Martínez.pdf` y contiene las dos columnas con las tres secciones completas.
8. Comprobar el troceado con contenido largo: añadir experiencias hasta pasar de una página y verificar que el PDF tiene varias páginas sin perder contenido al final. Prueba: la última tarjeta del listado aparece en la última página del PDF.
9. Marcar `[x] Pasar a PDF la información de Curriculum` en `references/TODO.md`. Prueba: el fichero refleja la tarea completada.
10. Revisión final: `npm run build` sin errores, `npm run lint` sin avisos nuevos, las cinco páginas de administración y las cuatro pestañas de `/` funcionando igual que antes.

## Criterios de aceptación

- [ ] Pulsar `Export to PDF` descarga un fichero llamado `CV {nombre} {apellidos}.pdf` con los datos del perfil cargado.
- [ ] Sin perfil en la base de datos, el botón sigue funcionando y el fichero se llama `CV.pdf`.
- [ ] El PDF contiene, en la columna izquierda: la foto centrada, dirección, teléfono y email con sus iconos, y debajo el bloque `Conocimientos` en texto plano con el nombre en negrita y el nivel entre paréntesis cuando lo haya.
- [ ] El PDF contiene, en la columna derecha: nombre y apellidos, descripción y, en este orden y en columna, `Experiencia`, `Formación Académica` y `Formación Complementaria`, esta última en texto plano con el nombre en negrita y `(institución - fecha)` cuando los haya.
- [ ] El PDF incluye **todos** los registros de las tres secciones, no solo los de la pestaña activa ni solo los visibles en pantalla.
- [ ] El contenido del PDF es el mismo con cualquiera de las cuatro pestañas seleccionadas antes de pulsar el botón.
- [ ] Con contenido que supera una página A4, el PDF tiene varias páginas y el último registro aparece completo en la última página.
- [ ] Las experiencias salen en el PDF de más reciente a más antigua por `fechaInicio`, y las dos formaciones por `fechaFin`, igual que en pantalla.
- [ ] Una experiencia sin `fechaFin` muestra `En la actualidad` también en el PDF.
- [ ] Una sección sin registros no aparece en el PDF: ni su título ni un mensaje de vacío.
- [ ] El nodo oculto del PDF no es visible en pantalla, no genera scroll horizontal y no altera la posición de ningún elemento de `/`.
- [ ] Los iconos de contacto se ven en el PDF; ninguna imagen sale en blanco o rota.
- [ ] La consola no muestra ningún `console.log` al exportar (los mensajes de depuración propios de html2canvas no cuentan).
- [ ] El PDF descargado pesa menos de 1 MB con el currículum completo.
- [ ] `exportToPDF` no contiene referencias a `cors-anywhere` ni el bloque comentado de `document.html`.
- [ ] Las cuatro pestañas de `/` siguen funcionando exactamente igual que en la SPEC 09.
- [ ] `npm run build` compila sin errores de TypeScript y `npm run lint` no añade avisos nuevos.
- [ ] `/experiencia`, `/formacion`, `/formacion-complementaria`, `/conocimiento` y `/perfil` siguen funcionando igual.

## Decisiones tomadas y descartadas

- **DOM oculto + html2canvas**, en vez de dibujar el PDF con la API de jsPDF a mano o usar `jsPDF.html()`. Reutiliza los componentes y el SCSS que ya existen, y el PDF sale fiel a lo que se ve. Dibujar por coordenadas daría texto seleccionable pero obliga a maquetar todo a mano y a mantener dos diseños; `jsPDF.html()` soporta mal el SCSS moderno y rompe el layout. El precio aceptado es que el PDF es una imagen.
- **Nodo siempre montado fuera de pantalla**, no montado bajo demanda al pulsar. Montar y capturar en el mismo tick obliga a esperar al render (`setTimeout`, `flushSync` o un `useEffect` con flag), un patrón frágil que no existe hoy en el proyecto. Descartado `display: none` porque html2canvas mediría `0x0` y el PDF saldría vacío.
- **Componente `CurriculumPDF` nuevo, tarjetas reutilizadas.** El layout de papel es distinto del de pantalla (dos columnas, sin pestañas, sin scroll), pero el contenido de cada tarjeta es idéntico: duplicar los cuatro `Item` en versión impresión crearía cuatro sitios más que mantener sincronizados. Si más adelante hace falta tipografía más compacta, se ajusta desde `CurriculumPDF.module.scss`.
- **Troceado multipágina desplazando la misma imagen**, no escalado a una sola página ni recorte. Escalar hace ilegible el texto en cuanto hay varias experiencias; recortar pierde información en silencio, que es justo el fallo que esta spec viene a corregir.
- **Ancho fijo de `794px` en el nodo oculto.** Es A4 a 96 dpi: fija la relación de aspecto para que el troceado por altura de página cuadre y hace que el PDF no dependa del tamaño de la ventana del visitante.
- **La ordenación se extrae a una función compartida** en vez de repetirla en `CurriculumPDF`. Duplicarla garantizaría que pantalla y PDF acabaran divergiendo; `CurriculumPDF` recibe los listados ya ordenados y no decide nada.
- **En el PDF no se pintan los mensajes de sección vacía.** En pantalla el mensaje informa de que la sección existe y está vacía; en un currículum impreso, un apartado que dice `Sin experiencia registrada` juega en contra de quien lo entrega.
- **Los conocimientos van bajo la foto, no como cuarta sección de la derecha.** Es lo pedido y además equilibra las columnas: la izquierda quedaba con un hueco vacío bajo el bloque de contacto.
- **Fallback a `CV.pdf` en vez de deshabilitar el botón sin perfil.** Un botón deshabilitado sin explicación se lee como un fallo, y el proyecto no consume hoy `loading` en ninguna vista para justificar el estado intermedio.
- **La imagen del PDF va en JPEG calidad `0.92`, no en PNG.** Con PNG el fichero salía de 40 MB, inmanejable para adjuntarlo a una candidatura; en JPEG baja a ~630 KB sin tocar `scale: 2`, así que la nitidez del texto no cambia de forma apreciable.
- **Conocimientos y Formación Complementaria en texto plano, no en tarjeta.** Son listados de una o dos palabras por registro: la tarjeta con fondo, borde y padding gastaba media página en aire. Experiencia y Formación Académica sí conservan su estructura, pero también pierden fondo y borde: en papel el color de tarjeta no aporta y sí consume tinta.
- **Se elimina el modo "exportar la pestaña activa"** en lugar de conservarlo junto al nuevo. Nadie lo pidió, y mantener dos modos exige un segundo botón o un selector que ensucia la única acción de la vista pública.

## Riesgos identificados

| Riesgo | Mitigación |
| ------ | ---------- |
| Una tarjeta se parte por la mitad entre dos páginas | Declarado fuera de alcance: el troceado es por altura fija y no respeta bloques. Se acepta a cambio de no perder contenido |
| Con muchos registros, el canvas a `scale: 2` puede acercarse al límite de tamaño del navegador y salir en blanco | El paso 8 prueba explícitamente con contenido largo; si aparece, bajar `scale` a `1.5` es un cambio de una línea |
| La foto viene de una URL externa (`perfil.foto`) y CORS puede ensuciar el canvas, dejando la imagen en blanco o abortando la exportación | Se mantiene `useCORS: true`; el criterio de aceptación exige comprobar que ninguna imagen sale rota. Si el servidor de la foto no manda cabeceras CORS, el respaldo local `/references/foto.jpg` sigue funcionando |
| El PDF en PNG pesaba 40 MB, inservible para adjuntarlo a una candidatura | Resuelto durante la implementación pasando el volcado a JPEG calidad `0.92`: 632 KB con el currículum completo |
| Los iconos SVG cargados con `<img src="/icons/...">` a veces no se pintan en html2canvas | Se comprueba en el paso 7 antes de dar la exportación por buena; si fallan, la alternativa es incrustarlos como SVG en línea |
| El nodo oculto puede provocar scroll horizontal o alargar la página si el `position: absolute` no se aplica bien | Criterio de aceptación explícito: la página `/` no cambia de aspecto ni gana scroll |
| El nodo oculto duplica el renderizado de todo el currículum en cada cambio de estado de `MainPage` | El contenido es estático y de tamaño pequeño; si se notara, la mitigación es memoizar `CurriculumPDF` |
| Cambiar `exportToPDF` de un parámetro a dos rompe cualquier otra llamada existente | Hoy solo lo llama `MainPage`; el paso 1 y `npx tsc --noEmit` lo verifican |
