# SPEC 12 — Tests de las páginas de administración con Vitest

> **Estado:** Aprobada
> **Depende de:** SPEC 03 (`03-editar-experiencia-frontend.md`, Implementada), SPEC 04 (`04-editar-conocimiento-frontend.md`, Implementada), SPEC 05 (`05-editar-formacion-frontend.md`, Implementada) y SPEC 06 (`06-editar-formacion-complementaria-frontend.md`, Implementada), que fijan el flujo crear/editar/actualizar/eliminar de las cuatro páginas, y SPEC 08 (`08-mensaje-accion-formularios.md`, Implementada), que fija los textos "{} creada/actualizada/eliminada"
> **Fecha:** 2026-09-01
> **Objetivo:** Montar Vitest en el frontend y escribir cuatro archivos de test (`Experiencia`, `Formacion`, `FormacionComplementaria`, `Conocimiento`) que cubran los nueve casos de `references/tests.txt` más cinco casos de ramas (fallos de api y estados loading/error) renderizando la página real contra un mock del módulo `api`.

## Alcance

**Dentro:**

- Instalar como `devDependencies`: `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/user-event` y `@testing-library/jest-dom`.
- Bloque `test` dentro del `vite.config.js` existente (no se crea un `vitest.config.ts` aparte): `globals: true`, `environment: 'jsdom'`, `setupFiles: './test/setup.ts'`, `include: ['test/**/*.test.tsx']` y `css: false` (por defecto), de modo que los `.module.scss` se resuelven como proxy de nombres de clase y no se compila Sass en los tests.
- Bloque `coverage` con `provider: 'v8'`, `reporter: ['text', 'html']`, `include` limitado a los doce archivos bajo prueba (las 4 páginas, sus 4 forms y sus 4 cards) y `thresholds` al 80% en `lines`, `statements`, `functions` y `branches`.
- Scripts nuevos en `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"` y `"test:coverage": "vitest run --coverage"`.
- `test/setup.ts`: `import '@testing-library/jest-dom/vitest'` y `afterEach(cleanup)`.
- `test/utils/renderConStore.tsx`: helper que crea un **store nuevo por test** con `configureStore` y los seis reducers de `src/store`, y renderiza el componente dentro de `<Provider>`. Devuelve lo de `render` más el `store`. No se usa el singleton `store` de `src/store/store.ts`, que compartiría estado entre tests.
- Cuatro archivos de test en `test/pages/` (carpeta que ya existe vacía en la raíz del frontend): `Experiencia.test.tsx`, `Formacion.test.tsx`, `FormacionComplementaria.test.tsx` y `Conocimiento.test.tsx`.
- En cada archivo, mock del módulo `src/api/api` con `vi.hoisted` + `vi.mock`, devolviendo el mismo objeto en `default` y en el export nombrado `api`. Con el módulo mockeado no se ejecuta `getEnvVariables()` ni hace falta ningún `.env` en los tests.
- Todo lo que hay por debajo de la página se ejecuta de verdad: hooks `useXStore`, slices de Redux, forms, cards y `MensajeAccion`.
- Fake timers en los cuatro archivos (`vi.useFakeTimers()` en `beforeEach`, `vi.useRealTimers()` en `afterEach`) y `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`, para poder avanzar la animación letra a letra de `MensajeAccion` y assertar el texto completo.
- Los nueve casos de `references/tests.txt` más los cinco casos de ramas, replicados en los cuatro archivos (56 tests en total, 14 por archivo). Ver la tabla y la lista de la sección "Modelo de datos".
- Cada archivo define sus propios fixtures con dos instancias iniciales que devuelve `api.get`.
- En `Experiencia.test.tsx`, `api.get('/conocimiento')` responde `[]`, de modo que el form pinta "No hay tecnologías disponibles" y no aparece el `MultiSelect`. Solo se rellenan los campos obligatorios (`Company`, `Posición`, `Fecha inicio`).

**Fuera de alcance (para futuras specs):**

- Tests de `Perfil.tsx`, `MainPage.tsx`, las páginas de `src/pages/curriculum/` y el router.
- Tests unitarios de componentes sueltos: `MultiSelect`, `Tabs`, `Button`, `MensajeAccion`, y de los helpers (`exportToPDF`, `ordenarCurriculum`, `dateConverter`).
- Tests de los slices o de los hooks `useXStore` de forma aislada: aquí se ejercitan de rebote a través de la página.
- Interacción con el `MultiSelect` de tecnologías y con los hitos dinámicos de `ExperienciaForm`.
- Tests del backend (`amm-curriculum-vitae-backend`).
- MSW o cualquier servidor HTTP falso.
- Tests E2E (Playwright/Cypress) y regresión visual.
- Integración en CI: los tests se lanzan a mano con `npm test`.
- Añadir validación visible propia a los formularios. La validación sigue siendo el `required` nativo del navegador.
- Marcar `[ ] Tests unitarios` en `references/TODO.md`: queda sin marcar mientras `Perfil` y los componentes no tengan tests.

## Modelo de datos

Esta funcionalidad no introduce estructuras de datos de producción ni toca el backend. Solo añade fixtures de test, que reutilizan las interfaces existentes (`Experiencia`, `Formacion`, `FormacionComplementaria`, `Conocimiento`).

Los cuatro archivos comparten la misma matriz de casos y solo cambian el recurso, los campos y los textos:

| Archivo | Ruta API | Campos obligatorios rellenados | Botón crear / editar | Mensajes esperados |
| --- | --- | --- | --- | --- |
| `Experiencia.test.tsx` | `/experiencia` (+ `/conocimiento` → `[]`) | Company, Posición, Fecha inicio | `Agregar Experiencia` / `Actualizar Experiencia` | `Experiencia creada` / `actualizada` / `eliminada` |
| `Formacion.test.tsx` | `/formacion` | Título, Institución, Fecha de Fin | `Agregar Formación` / `Actualizar Formación` | `Formación creada` / `actualizada` / `eliminada` |
| `FormacionComplementaria.test.tsx` | `/formacion-complementaria` | Título, Institución | `Agregar Formación Complementaria` / `Actualizar Formación Complementaria` | `Formación Complementaria creada` / `actualizada` / `eliminada` |
| `Conocimiento.test.tsx` | `/conocimiento` | Título (Nivel ya trae valor por defecto) | `Agregar Conocimiento` / `Actualizar Conocimiento` | `Conocimiento creado` / `actualizado` / `eliminado` |

Los catorce tests de cada archivo:

1. Se pintan tantas Cards como instancias devuelve `api.get`.
2. Se pinta el formulario: cada campo (localizado por su `label`), el botón de crear y el botón `Borrar formulario`.
3. Rellenar el formulario y pulsar `Borrar formulario` deja todos los campos vacíos (o en su valor por defecto).
4. Rellenar y pulsar el botón de crear llama a `api.post`, pinta una Card nueva y muestra el mensaje "{} creada".
5. Dejar vacío un campo obligatorio y pulsar crear: no se llama a `api.post`, no aparece Card nueva ni mensaje, y el campo queda inválido.
6. Pulsar `Editar` en una Card vuelca sus datos en el formulario, cambia el título a "Editar {}" y la etiqueta del botón a "Actualizar {}".
7. Pulsar `Editar` y luego `Borrar formulario` limpia los campos y desacopla el id: el botón vuelve a "Agregar {}" y el título a "Crear {}".
8. Pulsar `Editar`, cambiar un campo y pulsar `Actualizar` llama a `api.put` con el id correcto, la Card refleja el dato nuevo y se muestra "{} actualizada".
9. Pulsar `Eliminar` en una Card llama a `api.delete`, la Card desaparece del listado y se muestra "{} eliminada".
10. Si `api.post` falla, no se pinta Card nueva ni mensaje.
11. Si `api.put` falla, la Card mantiene su dato anterior y no hay mensaje.
12. Si `api.delete` falla, la Card sigue en el listado y no hay mensaje.
13. Con `loading` en el store, la página pinta "Loading..." y no el formulario.
14. Con `error` en el store, la página pinta "Error: {}" y no el formulario.

El mock de `api` responde con la forma que espera cada hook: `post` devuelve `{ data: <instancia nueva con id> }`, `put` devuelve `{ data: <instancia actualizada> }` y `delete` devuelve `{ data: { id } }` (los hooks filtran el listado por `data.id`).

## Plan de implementación

1. Instalar las devDependencies y añadir los tres scripts a `package.json`. Comprobación: `npx vitest --version` responde.
2. Añadir el bloque `test` (y `coverage`) al `vite.config.js` y crear `test/setup.ts`. Comprobación: `npm test` termina sin errores de configuración.
3. Crear `test/utils/renderConStore.tsx` con la factoría de store y el wrapper `<Provider>`.
4. Escribir `test/pages/Conocimiento.test.tsx` completo (los nueve casos). Es la página más simple y fija el patrón: mock de `api` con `vi.hoisted`, fixtures, fake timers y lectura del `MensajeAccion`. Comprobación: `npm test -- Conocimiento` pasa en verde.
5. Extraer a `test/utils/` lo que se repita (avanzar timers y leer el texto del `MensajeAccion`).
6. Escribir `test/pages/Formacion.test.tsx` siguiendo el patrón del paso 4.
7. Escribir `test/pages/FormacionComplementaria.test.tsx`.
8. Escribir `test/pages/Experiencia.test.tsx`, con `api.get('/conocimiento')` respondiendo `[]` y solo los campos obligatorios.
9. Ejecutar `npm run test:coverage` y ajustar hasta que los doce archivos incluidos superen el umbral del 80%.

## Criterios de aceptación

- [ ] `npm test` ejecuta 56 tests repartidos en 4 archivos y todos pasan.
- [ ] Existen `test/pages/Experiencia.test.tsx`, `test/pages/Formacion.test.tsx`, `test/pages/FormacionComplementaria.test.tsx` y `test/pages/Conocimiento.test.tsx`.
- [ ] Ningún test hace una petición HTTP real: `src/api/api` está mockeado en los cuatro archivos.
- [ ] Cada archivo cubre los nueve casos de `references/tests.txt` y los cinco casos de ramas, uno por `it`.
- [ ] Los tests de creación, actualización y borrado assertan el texto exacto del mensaje ("Conocimiento creado", "Formación actualizada", "Experiencia eliminada", …) tras avanzar los timers.
- [ ] El test de campo obligatorio verifica que `api.post` no se ha llamado y que no aparece Card nueva ni mensaje.
- [ ] Cada test crea su propio store: ejecutar los cuatro archivos en cualquier orden da el mismo resultado.
- [ ] `npm run test:coverage` termina en verde con los umbrales del 80% sobre los doce archivos incluidos.
- [ ] `npm run build` sigue terminando sin errores de TypeScript.
- [ ] `npm run lint` no reporta errores nuevos en `test/`.
- [ ] No se ha modificado ningún archivo de `src/` salvo lo estrictamente necesario para poder testear; si ha hecho falta, queda anotado en esta spec.

## Decisiones tomadas y descartadas

- **Sí:** mockear el módulo `src/api/api`. Es la única frontera real con el exterior: por debajo se prueban de verdad la página, el form, la card, el hook y el slice, que es donde están los bugs.
- **No:** mockear los hooks `useXStore`. Habría que simular a mano el estado después de cada operación y el test dejaría de probar el flujo que dice probar.
- **No:** MSW. Más realismo del que hace falta a cambio de una dependencia más y handlers para cuatro recursos.
- **Sí:** `test/pages/` en la raíz del frontend, reutilizando la carpeta vacía que ya existe, en lugar de `src/test/pages` como decía `references/tests.txt`. Los tests quedan fuera del código que se compila.
- **Sí:** store nuevo por test mediante `configureStore` en el helper. El `store` exportado por `src/store/store.ts` es un singleton y filtraría estado entre tests, haciéndolos dependientes del orden.
- **Sí:** fake timers. `MensajeAccion` tarda 1s en escribir el texto y 4s más en borrarlo; con timers reales cada assert de mensaje sumaría más de un segundo y sería frágil.
- **No:** mockear `MensajeAccion`. Es justo el componente que valida los mensajes de la SPEC 08.
- **Sí:** para el caso de campo obligatorio, assertar que no se crea nada. La validación de hoy es el `required` nativo, que no deja rastro en el DOM.
- **No:** añadir mensajes de error propios a los cuatro formularios para poder assertarlos. Es cambiar código de producción dentro de una spec cuyo objetivo es escribir tests; si se quiere, va en su propia spec.
- **Sí:** en `Experiencia`, devolver `[]` en `/conocimiento` y probar solo los campos obligatorios. Así los nueve casos se prueban igual que en las otras tres páginas, sin arrastrar la lógica de dropdown y teclado del `MultiSelect`.
- **Sí:** configuración dentro de `vite.config.js`. Evita duplicar plugins y alias en un segundo archivo.
- **Sí:** coverage con `include` limitado a los doce archivos bajo prueba. Un umbral global sobre todo `src/` fallaría desde el primer día por el código que esta spec deja fuera a propósito.
- **Sí:** `css: false`. Los `.module.scss` se resuelven como proxy de nombres de clase; compilar Sass en cada test solo añadiría segundos.
- **No:** marcar `[x] Tests unitarios` en `references/TODO.md`. Quedan sin cubrir `Perfil`, los componentes y los helpers.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| jsdom puede no bloquear el envío del formulario ante un `required` vacío, y entonces sí se llamaría a `api.post` | Se comprueba primero con el test piloto de `Conocimiento`. Si jsdom no bloquea, el test asserta `expect(campo).toBeInvalid()` y `expect(formulario).toBeInvalid()` en vez de "`api.post` no llamado", y se anota el cambio en esta spec. |
| Mezclar fake timers con `userEvent` cuelga los tests si no se conecta el reloj | `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` en cada test, siempre después de `vi.useFakeTimers()`. |
| Los `input type="date"` se comportan de forma distinta en jsdom | Se rellenan con `fireEvent.change` y valor `YYYY-MM-DD` si `userEvent.type` da problemas. |
| `vi.mock` con ruta relativa podría no interceptar el módulo que importan los hooks | La ruta se escribe relativa al archivo de test (`../../src/api/api`), que Vitest resuelve al mismo id de módulo. Se verifica en el paso 4 antes de replicar el patrón. |
| Los `console.log` de los hooks ensucian la salida de los tests | El módulo `api` está mockeado (no se ejecuta su `console.log`); los de los hooks se silencian en `test/setup.ts` si molestan. |
| El umbral del 80% puede no alcanzarse en `ExperienciaForm` por dejar fuera `MultiSelect` e hitos | El `include` de coverage se ajusta en el paso 9; si `ExperienciaForm` no llega, se baja su umbral de forma explícita y documentada en vez de inflar los tests. |
| `test/` fuera de `src/` puede quedar fuera del `tsconfig.json` y perder tipos | Se añade `test` al `include` del `tsconfig.json` junto con `"types": ["vitest/globals"]`. |

## Notas de implementación

- **Puente `globalThis.jest` en `test/setup.ts`.** `@testing-library/dom` 10.4.1 solo detecta que hay fake timers a través del global `jest` (`jestFakeTimersAreEnabled` en `helpers.js`). Con Vitest ese global no existe, así que su `asyncWrapper` espera un `setTimeout` que nadie avanza y cualquier interacción de `user-event` se cuelga hasta el timeout del test: los nueve tests del piloto fallaban por esto. Se añade en `test/setup.ts` un objeto `globalThis.jest` con `advanceTimersByTime` delegando en `vi.advanceTimersByTime`. Solo afecta a `test/`; no se toca `src/`.
- **La forma de la respuesta de `delete` cambia según el recurso.** La spec decía `{ data: { id } }` para los cuatro, pero eso solo vale en `/conocimiento`. El backend responde `{ msg, formacion }`, `{ msg, formacionComplementaria }` y `{ msg, experiencia, hitosEliminados }`, y cada hook lee `data.<recurso>.id`. Con el mock uniforme, el `delete` de esos tres recursos cae en el `catch` y ni se borra la Card ni sale el mensaje. Cada archivo de test mockea la forma real de su recurso; no se toca `src/`.
- **La ruta real de formación complementaria es `/formacionComplementaria`.** La tabla de "Modelo de datos" decía `/formacion-complementaria`; el hook llama a la ruta en camelCase y es esa la que assertan los tests. Además `Fecha de Fin` no es `required` en ese formulario, así que el test de creación la deja vacía y el payload lleva `fechaFin: ''`.
- **Cinco casos más por archivo (paso 9).** Con los nueve casos originales el coverage se quedaba en 75.97% de ramas. En vez de bajar el umbral o sacar `ExperienciaForm` del `include`, se añadieron los casos 10-14 (fallo de `post`/`put`/`delete` y los estados `loading` y `error`), que cubren las ramas de las cuatro páginas. Total: **56 tests**, 14 por archivo. Para los casos 13 y 14, `renderConStore` acepta un `preloadedState` opcional.
- **Umbral propio para `ExperienciaForm.tsx`** en `vite.config.js` (lines/statements 70, functions 40, branches 60), como preveía el cuadro de riesgos: el `MultiSelect` y los hitos dinámicos están fuera del alcance. El resto de archivos y el cómputo global sí superan el 80%.
- **Riesgo del `required` descartado.** jsdom sí bloquea el envío del formulario con un campo `required` vacío. El test del caso 5 asserta que `api.post` no se ha llamado, que no aparece Card nueva ni mensaje y, además, `toBeInvalid()` sobre el campo. No hace falta el plan B del cuadro de riesgos.
- **`flush()` en vez de `findBy*` / `waitFor`.** Con fake timers, las utilidades asíncronas de Testing Library resultan frágiles; los tests esperan a las promesas del mock de `api` con un helper `flush()` (`act` + cola de microtareas).
- **Vitest 4.** La versión instalada es la 4.x, no la 3.x. La configuración del bloque `test` / `coverage` es la misma; `defineConfig` se importa de `vitest/config` para tipar el bloque `test`.
- **`tsconfig.json`.** Se añade `test` al `include` y `"types": ["vitest/globals"]`, tal como preveía el cuadro de riesgos.

## Lo que **no** entra en esta spec

- Tests de `Perfil`, `MainPage`, `curriculum/` y el router.
- Tests unitarios de `MultiSelect`, `Tabs`, `Button`, `MensajeAccion` y los helpers.
- Tests de slices y hooks de forma aislada.
- Tests del backend.
- E2E y regresión visual.
- Integración en CI.
- Validación visible propia en los formularios.

Cada una de ellas, si llega, va en su propia spec.
