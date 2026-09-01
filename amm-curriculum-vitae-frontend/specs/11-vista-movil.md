# SPEC 11 — Vista móvil de todas las páginas

> **Estado:** Implementada
> **Depende de:** SPEC 09 del frontend (`09-curriculum-pestanas-y-contacto.md`, Implementada), que fija `Tabs` y el bloque de contacto, y SPEC 10 (`10-export-pdf-curriculum.md`, Implementada), que fija el nodo oculto `CurriculumPDF`
> **Fecha:** 2026-09-01
> **Objetivo:** Adaptar las seis páginas a pantallas de menos de 768px con un único `@media (max-width: 768px)` por hoja de estilos, apilando la página principal en el orden del boceto con las pestañas tras un menú hamburguesa, y poniendo el formulario antes del listado de Cards en las páginas de administración.

## Alcance

**Dentro:**

- Breakpoint único `@media (max-width: 768px)` escrito al final de cada `.module.scss` afectado. Por encima de 768px no cambia ni un píxel del diseño actual.
- `MainPage.module.scss`: bajo el breakpoint `.basicInformation` pasa a `flex-direction: column`, `.information` pasa a `display: contents` y sus hijos se reordenan con `order` junto a los de `.column`. Orden resultante: nombre → descripción → bloque foto+contacto → botón `Export to PDF` → pestañas.
- Para poder separar el botón `Export to PDF` de la foto, en móvil `.column` también pasa a `display: contents`, y foto y contacto se agrupan en un contenedor propio `.identidad`.
- `.identidad` en móvil es una fila: foto a la izquierda (`120px × 120px`, `object-fit: cover`, mismo `border-radius: 15%`) y las tres líneas de contacto a su derecha. El bloque `.contacto` deja de tener `width: 300px` fijo y pasa a `flex: 1; min-width: 0`.
- El botón `Export to PDF` se mantiene en el flujo, entre el bloque foto+contacto y las pestañas, a ancho completo (`width: 100%`).
- Se añade un `div` envolvente `.identidad` en `MainPage.tsx` alrededor de la `<img>` de la foto y del bloque `.contacto`. Es el único cambio de marcado de la spec. En escritorio `.identidad` es un `display: contents` neutro, para que la columna actual no se altere.
- La franja `.header` se conserva tal cual. El nombre (`.name`) baja de `3rem` a `2rem` bajo el breakpoint.
- `Tabs.tsx` + `Tabs.module.scss`: bajo 768px la barra `.lista` se sustituye por una fila con el título de la pestaña activa a la izquierda y un botón hamburguesa a la derecha, sobre la misma línea inferior de 2px. Al pulsarlo se despliega una lista vertical con las cuatro pestañas justo debajo de la fila.
- El desplegable se cierra al elegir una pestaña y al pulsar fuera (listener `mousedown` sobre `document`, registrado solo mientras está abierto y retirado en el `cleanup` del `useEffect`).
- Nuevo estado en `Tabs.tsx`: `menuAbierto`. El componente renderiza siempre las dos variantes; cuál se ve la decide el CSS (`display: none` en la que no toca). No hay medición de ancho ni listener de `resize`.
- `Tabs.module.scss`: bajo el breakpoint `.panel` pierde `max-height` y `overflow-y` (`max-height: none; overflow-y: visible`) y el `padding-right` reservado para la barra de scroll.
- `Layout.module.scss`: bajo el breakpoint `.Page` pasa a `flex-direction: column`, pierde `height: 100vh` (`height: auto`) y baja el `padding` a `1rem`. `.form` recibe `order: 1` y `.data` `order: 2`, de modo que el formulario queda arriba y el listado de Cards abajo sin tocar ningún `.tsx` de página. `.data` pierde `overflow-y: scroll` (`overflow-y: visible`) y `height: 100%` (`height: auto`).
- `Form.module.scss`: bajo el breakpoint `.field` pasa a `flex-direction: column` con `gap: 0.25rem`, la `label` pierde el `width: 150px` fijo (`width: auto`) y los `input`/`select` pasan a `width: 100%` perdiendo el `max-width: 50vw`. `.hitos .hitoFila` se mantiene en fila.
- `Cards.module.scss`: bajo el breakpoint `.Card` pierde `max-width: 600px` (`max-width: none`) y `margin-right`, y pasa a `flex-direction: column` para que los botones de acción queden bajo los datos en vez de comprimirlos.
- Las seis páginas cubiertas: `/` (`MainPage`), `/experiencia`, `/formacion`, `/formacion-complementaria`, `/conocimiento` y `/perfil`. Las cinco últimas comparten `Layout.module.scss`, `Form.module.scss` y `Cards.module.scss`, así que se resuelven con esas tres hojas.
- Se marca `[x] Vista móvil` en `references/TODO.md`.

**Fuera de alcance (para futuras specs):**

- `CurriculumPDF` y el PDF generado: el nodo oculto conserva su ancho fijo de `794px`. Desde el móvil se exporta exactamente el mismo PDF que desde escritorio.
- Menú de navegación entre páginas. Hoy no existe ninguno: a `/experiencia`, `/perfil` y el resto se llega escribiendo la URL. Añadirlo es otra spec.
- Tests automatizados y capturas de regresión visual. La comprobación es manual con las DevTools.
- Modo oscuro y cualquier rework visual: paleta, tipografía o rediseño de tarjetas.
- Breakpoint intermedio de tablet: entre 768px y el escritorio no se define nada nuevo.
- `MultiSelect` de tecnologías y `MensajeAccion`: solo se adaptan si el ancho del formulario los arregla por sí solo. No se les escribe media query propia.
- Gestos táctiles: deslizar entre pestañas, pull-to-refresh, menú lateral.
- Optimización del peso de la foto o imágenes responsive (`srcset`).

## Modelo de datos

Esta funcionalidad no introduce estructuras de datos nuevas ni toca el backend. Reutiliza el modelo que fijan las SPEC 09 y 10.

El único estado nuevo es de interfaz, dentro de `Tabs.tsx`:

```ts
const [menuAbierto, setMenuAbierto] = useState(false);
```

No se persiste. Vuelve a `false` al elegir pestaña, al pulsar fuera y en cada montaje del componente.

## Plan de implementación

1. `Layout.module.scss`: añadir el bloque `@media (max-width: 768px)` con `.Page` en columna, sin `height: 100vh`, y `order` en `.form` y `.data`. Comprobación manual: en DevTools a 390px, `/experiencia` muestra el formulario arriba y las Cards debajo, con un solo scroll de página.
2. `Form.module.scss`: añadir el bloque móvil con `.field` en columna, `label` sin ancho fijo e inputs al 100%. Comprobación manual: a 360px ningún input se sale de la pantalla en `/perfil`.
3. `Cards.module.scss`: añadir el bloque móvil con `.Card` en columna y sin `max-width`. Comprobación manual: las tarjetas de `/formacion` ocupan el ancho disponible y los botones quedan debajo de los datos.
4. `Tabs.tsx`: añadir el estado `menuAbierto`, la fila móvil (título activo + botón hamburguesa) y la lista desplegable, con sus clases nuevas. Sin CSS todavía: en este punto se ven las dos variantes a la vez, y es correcto.
5. `Tabs.module.scss`: añadir el bloque móvil que oculta `.lista`, muestra la fila y el desplegable, y libera `.panel` del `max-height`; en escritorio, ocultar la fila móvil y el desplegable. Comprobación manual: a 390px se ve el nombre de la pestaña activa con el icono a la derecha; a 1200px, las cuatro pestañas en fila como hasta ahora.
6. `Tabs.tsx`: cerrar el desplegable al pulsar fuera con un `useEffect` que registra `mousedown` solo cuando `menuAbierto` es `true` y lo retira en el `cleanup`. Comprobación manual: abrir el menú y pulsar en el panel de contenido lo cierra.
7. `MainPage.tsx`: envolver la `<img>` de la foto y el bloque `.contacto` en un `div` con la clase `.identidad`, y declararla `display: contents` en escritorio. Comprobación manual: el escritorio sigue idéntico.
8. `MainPage.module.scss`: añadir el bloque móvil completo — `display: contents` en `.information` y `.column`, los `order`, `.identidad` en fila, foto a 120px, contacto flexible, botón a ancho completo y nombre a `2rem`. Comprobación manual: a 390px el orden coincide con el boceto.
9. Marcar `[x] Vista móvil` en `references/TODO.md`.

## Criterios de aceptación

- [ ] A 1200px de ancho, las seis páginas se ven exactamente igual que antes de esta spec.
- [ ] A 390px, `/` muestra los bloques en este orden de arriba abajo: nombre, descripción, foto+contacto, botón `Export to PDF`, pestañas.
- [ ] A 390px, la foto de `/` mide 120x120 y las tres líneas de contacto se pintan a su derecha, no debajo.
- [ ] A 390px, la barra de pestañas de `/` muestra el título de la pestaña activa y un botón hamburguesa, no las cuatro pestañas en fila.
- [ ] Pulsar el botón hamburguesa despliega las cuatro pestañas; elegir una cambia el panel y cierra el desplegable.
- [ ] Pulsar fuera del desplegable abierto lo cierra sin cambiar de pestaña.
- [ ] A 390px, `/experiencia`, `/formacion`, `/formacion-complementaria` y `/conocimiento` pintan el formulario por encima del listado de Cards.
- [ ] A 390px, en `/perfil` cada etiqueta queda encima de su campo y ningún `input` sobresale del ancho de la pantalla.
- [ ] A 360px, ninguna de las seis páginas produce scroll horizontal.
- [ ] A 390px, cada página tiene un único scroll vertical: ni el listado de Cards ni el panel de pestañas tienen barra propia.
- [ ] El botón `Export to PDF` pulsado desde 390px descarga el mismo PDF a dos columnas que en escritorio.
- [ ] `npm run build` termina sin errores de TypeScript ni de Sass.
- [ ] `references/TODO.md` tiene marcado `[x] Vista móvil`.

## Decisiones tomadas y descartadas

- **Sí:** breakpoint único en `max-width: 768px`. Cubre móviles y tablets en vertical con un solo bloque por hoja.
- **No:** dos breakpoints (1024 y 640). Triplica el CSS a escribir y a revisar para un currículum de una sola pantalla de contenido.
- **Sí:** `display: contents` + `order` para reordenar `MainPage`. El orden del boceto cruza `.information` y `.column`, y así se consigue sin reescribir la maquetación de escritorio, que ya funciona.
- **No:** sacar `<Tabs>` del JSX y recolocarlo con CSS grid en escritorio. Más robusto en teoría, pero obliga a rehacer un layout que hoy está bien.
- **No:** renderizado condicional por ancho con un hook de `resize`. Duplica el marcado y mete estado y listener donde basta una media query.
- **Sí:** un `div.identidad` nuevo en el marcado. Es el precio de poder separar el botón `Export to PDF` de la foto en móvil manteniendo `.column` como `display: contents`.
- **Sí:** desplegable bajo la barra para las pestañas. Se resuelve dentro de `Tabs.tsx`, sin portal ni bloqueo de scroll del `body`.
- **No:** overlay a pantalla completa. Más CSS y obliga a gestionar el scroll del `body`.
- **No:** `<select>` nativo. Sería lo más barato y accesible, pero no es el icono hamburguesa del boceto.
- **Sí:** botón `Export to PDF` en el flujo, a ancho completo, bajo el contacto. Cero lógica nueva.
- **No:** barra fija al fondo (sticky). Tapa contenido y obliga a reservar padding al final de cada página.
- **No:** ocultar el botón en móvil. Exportar el PDF desde el teléfono es un caso de uso válido.
- **Sí:** un único scroll de página en móvil, anulando `height: 100vh` y los `overflow` internos. Los scrolls anidados se atascan al tocar.
- **Sí:** etiqueta encima del campo en los formularios. Con `width: 150px` fijo, en 360px el input queda inservible.
- **Sí:** conservar la franja `.header` con su degradado y bajar el nombre a `2rem`. A `3rem` un nombre con apellidos largos ocupa tres líneas.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `display: contents` hace que `.information` pierda su `padding-right`, su `gap` y su `min-width: 0` | El `gap` se declara en `.basicInformation`, que en móvil es el flex container real; el padding lateral pasa a `.MainPage`. Se comprueba a 360px que nada se sale. |
| `display: contents` en `.column` también anula su `gap: 2rem` entre foto, contacto y botón | La separación en móvil la dan `.identidad` (fila con su propio `gap`) y el `margin` del botón. |
| El listener de `mousedown` puede tragarse el clic sobre el propio botón hamburguesa y reabrir el menú | El `ref` del contenedor del menú incluye el botón, y el listener ignora los clics dentro de ese `ref`. |
| El nodo oculto `CurriculumPDF` mide 794px y podría generar scroll horizontal en móvil | Ya está en `position: absolute; left: -10000px`, fuera del flujo. Se verifica explícitamente en el criterio de scroll horizontal a 360px. |
| El email largo del contacto desborda junto a una foto de 120px | `.contacto__linea` ya lleva `overflow-wrap: anywhere`; el bloque pasa a `flex: 1; min-width: 0` para que ese `wrap` funcione. |

## Lo que **no** entra en esta spec

- La maqueta y los estilos de `CurriculumPDF`, y el PDF resultante.
- Un menú de navegación entre las seis páginas.
- Tests automatizados o capturas de regresión visual.
- Modo oscuro y cualquier rediseño visual.
- Un breakpoint intermedio de tablet.
- Media queries propias para `MultiSelect` y `MensajeAccion`.
- Gestos táctiles e imágenes responsive.

Cada una de ellas, si llega, va en su propia spec.
