# SPEC 13 — Tests unitarios de los componentes con Vitest

> **Estado:** Implementada
> **Depende de:** SPEC 12 (`12-tests-paginas-vitest.md`, Implementada), que monta Vitest, `test/setup.ts`, `test/utils/` y el bloque `coverage` del `vite.config.js`; SPEC 08 (`08-mensaje-accion-formularios.md`, Implementada), que fija el comportamiento de `MensajeAccion`; SPEC 02 (`02-multiselect-tecnologias.md`, Implementada), que fija el `MultiSelect`; SPEC 09 (`09-curriculum-pestanas-y-contacto.md`, Implementada) y SPEC 11 (`11-vista-movil.md`, Implementada), que fijan las `Tabs` y su menú hamburguesa
> **Fecha:** 2026-09-02
> **Objetivo:** Escribir cuatro archivos de test unitario en `test/components/` (`Button`, `MensajeAccion`, `MultiSelect`, `Tabs`) que cubran los casos de `references/tests.txt` más la navegación por teclado del `MultiSelect`, e incluir los cuatro componentes en el `coverage` con umbral del 80%.

## Alcance

**Dentro:**

- Cuatro archivos nuevos en `test/components/` (carpeta nueva): `Button.test.tsx`, `MensajeAccion.test.tsx`, `MultiSelect.test.tsx` y `Tabs.test.tsx`.
- Se testea cada componente **aislado**, con `render` de `@testing-library/react` directo y props controladas desde el test. No hace falta `<Provider>` ni `renderConStore`: ninguno de los cuatro toca Redux ni el router.
- No se mockea nada: los cuatro componentes son puros y no importan `src/api/api`.
- Los componentes controlados (`MultiSelect`) se envuelven en un wrapper local del test que mantiene el estado `selected` y pasa un `onChange` espiado con `vi.fn()`, para poder assertar tanto la llamada como el repintado.
- Fake timers **solo** en `MensajeAccion.test.tsx` (`vi.useFakeTimers()` / `vi.useRealTimers()`), reutilizando el puente `globalThis.jest` que ya instala `test/setup.ts`. Los otros tres archivos usan timers reales y `userEvent.setup()` sin opciones.
- Ampliar el `include` del bloque `coverage` de `vite.config.js` con `src/components/Button.tsx`, `src/components/MensajeAccion.tsx`, `src/components/MultiSelect.tsx` y `src/components/Tabs.tsx`, sujetos al umbral global del 80% en `lines`, `statements`, `functions` y `branches`.
- Marcar `[x] Tests unitarios` en `references/TODO.md`.

**Fuera de alcance (para futuras specs):**

- Tests de los helpers: `exportToPDF`, `ordenarCurriculum`, `dateConverter`.
- Tests de `MainPage.tsx`, las páginas de `src/pages/curriculum/` y el router.
- Tests de slices y hooks `useXStore` de forma aislada.
- Tests del backend (`amm-curriculum-vitae-backend`).
- E2E (Playwright/Cypress) y regresión visual.
- Integración en CI: los tests se siguen lanzando a mano con `npm test`.
- Snapshots y tests de estilos: con `css: false` los `.module.scss` son un proxy de nombres de clase, así que no se asserta sobre clases CSS.
- Tests de accesibilidad automatizados (`axe`).
- Modificar `src/` para facilitar el testeo. Los cuatro componentes se testean tal como están hoy.
- Tocar los archivos de `test/pages/` ni sus umbrales.

## Modelo de datos

Esta funcionalidad no introduce estructuras de datos de producción. Solo fixtures locales a cada archivo de test, que reutilizan las interfaces existentes (`MultiSelectOption`, `MensajeAccion`) y el tipo `Tab` interno de `Tabs.tsx`.

### `Button.test.tsx` (4 tests)

1. Se pinta el `name` recibido por props.
2. Con `icon`, se pinta el `<i>` con la clase `icon-{icon}`.
3. Sin `icon`, no se pinta ningún `<i>`.
4. Al pulsar el botón se llama a `onClick` una vez.

### `MensajeAccion.test.tsx` (6 tests)

Fixture: un mensaje con el texto `Conocimiento creado`.

1. Con `mensaje = null` no se pinta texto: el `span[aria-live="polite"]` está vacío.
2. Avanzando la mitad de `DURACION_ENTRADA` (500 ms) se ve un prefijo del texto, no el texto completo.
3. Avanzando 1000 ms se ve el texto completo.
4. Tras el texto completo, avanzando `DURACION_ESPERA` + `DURACION_SALIDA` (4000 ms) el texto vuelve a quedar vacío.
5. Cambiar la prop `mensaje` a mitad de la escritura reinicia la animación: tras avanzar 1000 ms se ve el texto nuevo completo y no queda rastro del anterior.
6. Desmontar el componente a mitad de la animación no lanza actualizaciones de estado después: avanzar los timers tras el `unmount` no produce ningún error ni warning de React.

Los avances de tiempo van dentro de `act(() => vi.advanceTimersByTime(ms))`, reutilizando el helper `avanzarMensaje` de `test/utils/asincronia.ts` donde el avance sea de 1000 ms y `vi.advanceTimersByTime` directo donde no.

### `MultiSelect.test.tsx` (12 tests)

Fixture: tres opciones (`{ id: '1', label: 'React' }`, `{ id: '2', label: 'TypeScript' }`, `{ id: '3', label: 'Node' }`). Wrapper local con estado.

Ratón (los 7 casos de `references/tests.txt`):

1. Sin selección se pinta el `placeholder` recibido por props y no hay `role="listbox"`.
2. Al pinchar en la cabecera se despliega el `listbox` y se pintan las tres opciones.
3. Al pinchar en una opción, su `label` aparece como chip en la cabecera, su `aria-selected` pasa a `true` y su checkbox queda marcado.
4. Al volver a pinchar en la misma opción, el chip desaparece, `aria-selected` vuelve a `false` y el checkbox se desmarca.
5. Al pulsar el botón `Quitar {label}` (la X del chip) se quita el chip y la opción se desmarca.
6. Al pinchar fuera del componente (`mousedown` sobre `document.body`) el `listbox` desaparece.
7. Con `options={[]}`, al pinchar en la cabecera no aparece ninguna opción (`queryAllByRole('option')` vacío). Ver "Decisiones tomadas".

Teclado:

8. `ArrowDown` sobre la cabecera abre el desplegable y enfoca la primera opción.
9. `ArrowUp` sobre la cabecera abre el desplegable y enfoca la última opción.
10. `Enter` sobre la cabecera alterna abierto/cerrado; `Escape` sobre la cabecera lo cierra.
11. `ArrowDown` / `ArrowUp` sobre una opción mueven el foco de forma circular (de la última a la primera y viceversa).
12. `Enter` (o espacio) sobre una opción la selecciona; `Escape` sobre una opción cierra el desplegable y devuelve el foco a la cabecera.

Además, el test 3 asserta que se pinta un `input[type="hidden"]` con el `name` recibido y el `id` seleccionado como `value`.

### `Tabs.test.tsx` (6 tests)

Fixture: tres tabs (`{ id: 'perfil', titulo: 'Perfil', contenido: <p>Contenido perfil</p> }` y equivalentes).

1. Se pintan los tres títulos en la lista de escritorio y son botones clicables.
2. Al montar, se pinta el contenido de la primera tab y no el de las demás.
3. Al pinchar en otra tab de escritorio, cambia el contenido del panel.
4. El botón hamburguesa (`aria-label="Abrir menú de pestañas"`) empieza con `aria-expanded="false"`; al pulsarlo pasa a `true` y aparece el desplegable con los tres títulos.
5. Al pinchar en una tab del desplegable móvil, cambia el contenido del panel y el menú se cierra (`aria-expanded` vuelve a `false`).
6. Con el menú abierto, un `mousedown` fuera del contenedor lo cierra.

Como `Tabs` pinta **siempre** la lista de escritorio y el menú móvil (la diferencia real es solo CSS, y en los tests `css: false`), los títulos aparecen duplicados en el DOM. Las consultas se acotan: la barra móvil por el botón con `aria-label="Abrir menú de pestañas"` y su desplegable con `within()` sobre el contenedor que lo alberga; la lista de escritorio, con `getAllByRole('button', { name })` tomando el índice correspondiente. No se añaden `data-testid` a `src/`.

## Plan de implementación

1. Crear `test/components/Button.test.tsx` con los 4 casos. Es el componente más simple y fija el patrón de archivo sin store ni timers. Comprobación: `npm test -- Button` pasa en verde.
2. Crear `test/components/MensajeAccion.test.tsx` con los 6 casos y fake timers. Comprobación: `npm test -- MensajeAccion` pasa en verde y ningún test tarda más de lo que dura avanzar los timers.
3. Crear `test/components/Tabs.test.tsx` con los 6 casos, resolviendo primero la duplicidad escritorio/móvil en el DOM con consultas acotadas.
4. Crear `test/components/MultiSelect.test.tsx` con el wrapper de estado y los 7 casos de ratón.
5. Añadir a `MultiSelect.test.tsx` los 5 casos de teclado.
6. Extraer a `test/utils/` cualquier helper que se repita entre los cuatro archivos. El wrapper con estado del `MultiSelect` no se extrae: es local a su archivo.
7. Añadir los cuatro componentes al `include` de `coverage` en `vite.config.js` y ejecutar `npm run test:coverage` hasta que los dieciséis archivos incluidos pasen el umbral del 80%.
8. Marcar `[x] Tests unitarios` en `references/TODO.md`.
9. Ejecutar `npm run lint` y `npm run build` para comprobar que no hay errores nuevos.

## Criterios de aceptación

- [ ] Existen `test/components/Button.test.tsx`, `test/components/MensajeAccion.test.tsx`, `test/components/MultiSelect.test.tsx` y `test/components/Tabs.test.tsx`.
- [ ] `npm test` ejecuta los tests ya existentes de `test/pages/` más los 28 nuevos de `test/components/`, y todos pasan.
- [ ] Cada caso listado en la sección "Modelo de datos" está en su propio `it`.
- [ ] Ningún archivo de `test/components/` usa `renderConStore`, `<Provider>` ni mocks de `src/api/api`.
- [ ] Solo `MensajeAccion.test.tsx` usa fake timers.
- [ ] `MensajeAccion.test.tsx` asserta el texto parcial (500 ms), el completo (1000 ms) y el vacío tras el borrado (4000 ms más).
- [ ] `MultiSelect.test.tsx` asserta sobre `aria-selected` y sobre el estado `checked` del checkbox de cada opción, no sobre clases CSS.
- [ ] `Tabs.test.tsx` distingue la lista de escritorio del menú móvil sin haber añadido nada a `src/components/Tabs.tsx`.
- [ ] `vite.config.js` incluye los cuatro componentes en `coverage.include` y `npm run test:coverage` termina en verde con el umbral global del 80%, sin umbrales propios nuevos.
- [ ] `references/TODO.md` tiene `[x] Tests unitarios`.
- [ ] `npm run build` y `npm run lint` terminan sin errores nuevos.
- [ ] No se ha modificado ningún archivo de `src/`.

## Decisiones tomadas y descartadas

- **Sí:** `test/components/` como carpeta hermana de `test/pages/`, siguiendo la convención que fijó la SPEC 12 de dejar los tests fuera de `src/`.
- **Sí:** cubrir la navegación por teclado del `MultiSelect` aunque `references/tests.txt` no la mencione. Es aproximadamente el 40% de las ramas del componente: sin ella no se llega al 80% en `branches` y habría que abrirle un umbral propio, como pasó con `ExperienciaForm` en la SPEC 12. Se prefiere probar el componente entero a bajar el listón.
- **No:** tocar `MultiSelect.tsx` para que no abra un `listbox` vacío cuando `options` está vacío. El caso "Si no hay opciones no se despliega" de `references/tests.txt` se reinterpreta como "al pinchar no aparece ninguna opción". El comportamiento no ocurre en producción: `ExperienciaForm` pinta "No hay tecnologías disponibles" en lugar del `MultiSelect` cuando no hay tecnologías. Cambiar código de producción no cabe en una spec cuyo objetivo es escribir tests; si se quiere, va en su propia spec.
- **No:** añadir `data-testid` a `Tabs.tsx` para separar escritorio y móvil. Se resuelve con consultas acotadas (`aria-label` del hamburguesa y `within()`), sin tocar `src/`.
- **No:** mockear `matchMedia` para simular la vista móvil. `Tabs` no consulta media queries desde JS: el breakpoint es puramente CSS y ambos bloques están siempre en el DOM.
- **Sí:** fake timers solo en `MensajeAccion`. Es el único componente con `setInterval`/`setTimeout`. En los otros tres, mezclar fake timers con `userEvent` solo añade la ceremonia del puente `globalThis.jest` y el riesgo de cuelgues que documenta la SPEC 12, sin ganar nada.
- **Sí:** wrapper local con estado para el `MultiSelect`. Es un componente controlado: sin un padre que actualice `selected`, los casos 3, 4 y 5 no podrían assertar el repintado de los chips.
- **No:** `renderConStore` en estos cuatro archivos. Ninguno de los componentes lee del store; envolverlos en un `<Provider>` sería ruido.
- **Sí:** assertar sobre roles y atributos ARIA (`role="listbox"`, `role="option"`, `aria-selected`, `aria-expanded`) en vez de sobre clases CSS. Con `css: false` las clases son un proxy y no significan nada.
- **Sí:** umbral global del 80% para los cuatro componentes, sin excepciones por archivo. Son componentes pequeños y esta spec cubre todas sus ramas, incluida la del teclado.
- **Sí:** marcar `[x] Tests unitarios` en `references/TODO.md`. Con las páginas (SPEC 12) y los componentes cubiertos, se da por hecha la línea, aunque los helpers, `MainPage`, `curriculum/` y el router sigan sin tests y queden para specs futuras.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Los títulos de las tabs están duplicados en el DOM (escritorio + móvil) y `getByText` lanzaría "found multiple elements" | Consultas acotadas con `within()` y `getAllByRole` desde el primer test del paso 3; el hamburguesa se localiza por su `aria-label`, que es único. |
| El test 6 de `MensajeAccion` (desmontaje) puede pasar en verde sin comprobar nada si React no avisa | Se espía `console.error` con `vi.spyOn` y se asserta que no se ha llamado tras avanzar los timers post-`unmount`. |
| El foco del `MultiSelect` se aplica en un `useEffect`; `document.activeElement` puede leerse antes de tiempo | Los asserts de foco van tras el `await` de la interacción de `userEvent`, que ya envuelve en `act`. |
| `userEvent.click` dispara `mousedown`, que es el evento que cierra el desplegable: un clic en una opción podría cerrarlo antes de seleccionarla | El listener comprueba `contenedorRef.current.contains(e.target)`, así que un clic dentro no cierra. Se verifica en el paso 4 antes de escribir el resto de casos; si diera problemas, el clic fuera se dispara con `fireEvent.mouseDown(document.body)`. |
| Alcanzar el 80% en `Tabs.tsx` sin cubrir la rama `tabs[0]?.id ?? ''` | Si el coverage se queda corto, se añade un test con `tabs={[]}` que comprueba que no se pinta ningún botón ni contenido. |
| Añadir archivos al `include` de coverage baja el porcentaje global y podría romper el umbral de la SPEC 12 | El paso 7 ejecuta `npm run test:coverage` y se ajustan los tests, no los umbrales. El umbral propio de `ExperienciaForm` se deja como está. |

## Lo que **no** entra en esta spec

- Tests de los helpers (`exportToPDF`, `ordenarCurriculum`, `dateConverter`).
- Tests de `MainPage`, `curriculum/` y el router.
- Tests de slices y hooks de forma aislada.
- Tests del backend.
- E2E y regresión visual.
- Integración en CI.
- Cambios en `src/`.

Cada una de ellas, si llega, va en su propia spec.
