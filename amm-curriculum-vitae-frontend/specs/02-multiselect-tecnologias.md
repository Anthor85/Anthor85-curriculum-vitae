# SPEC 02 — Multiselect de tecnologías con chips

> **Estado:** Aprobado
> **Depende de:** SPEC 01 del frontend (`01-hitos-experiencia-frontend.md`, Implementada)
> **Fecha:** 2026-08-28
> **Objetivo:** Sustituir el multiselect de tecnologías de `ExperienciaForm` por un componente reutilizable `MultiSelect` con label, chips eliminables en la cabecera y lista desplegable flotante con scroll.

## Alcance

**Dentro:**

- Nuevo componente `src/components/MultiSelect.tsx` con sus estilos `src/components/MultiSelect.module.scss`.
- Cabecera con las opciones seleccionadas como chips (`título` + botón `X`) y un `+` a la derecha.
- Toda la cabecera abre y cierra el desplegable; solo la `X` de un chip queda excluida.
- Lista desplegable flotante (`position: absolute`) con `max-height: 200px` y `overflow-y: auto`.
- Placeholder cuando no hay nada seleccionado.
- Un `<input type="hidden" name="tecnologias" />` por opción seleccionada, para no tocar `useExperienciaStore.createExperiencia`.
- Label `Tecnologías:` encima del componente en `ExperienciaForm`, con el mismo patrón que el bloque de hitos.
- Limpieza en `Form.module.scss`: se eliminan `.multiselect`, `.selectBox`, `.overSelect`, `.checkboxes` y `.show`, y se añade el bloque `.tecnologias`.
- Eliminación de la función `showCheckboxes` y de la variable `expanded` de `ExperienciaForm`.

**Fuera de alcance (para futuras specs):**

- Usar `MultiSelect` en otros formularios (`ConocimientoForm`, `FormacionForm`, `FormacionComplementariaForm`, `PerfilForm`). Hoy ninguno tiene multiselect; el componente se crea reutilizable pero con un único consumidor.
- Buscador o filtro de texto dentro del desplegable.
- Navegación por teclado del desplegable (flechas, Enter, Escape) y roles ARIA de `combobox`/`listbox`.
- Cierre del desplegable al hacer clic fuera del componente.
- Reordenar los chips o limitar el número máximo de seleccionadas.
- Edición de las tecnologías de una experiencia ya creada.
- El `TODO Cambiar esto a conocimiento` del nombre del estado: se mantiene `selectedTecnologias`.

## Modelo de datos

No se introducen estructuras nuevas ni cambia el payload del `POST /api/experiencia`: sigue enviando `tecnologias` como array de ids, igual que tras la SPEC 01.

Contrato del componente, en `src/components/MultiSelect.tsx`:

```tsx
export interface MultiSelectOption {
  id: string;
  label: string;
}

interface MultiSelectProps {
  name: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}
```

`options` recibe ids y etiquetas ya normalizados; el componente no conoce `Conocimiento`. En `ExperienciaForm` se mapea:

```ts
conocimiento.map((t: Conocimiento) => ({ id: t.id, label: t.titulo }));
```

El componente es controlado: `selected` y `onChange` viven en `ExperienciaForm` (el estado `selectedTecnologias` que ya existe). El único estado propio del componente es `const [abierto, setAbierto] = useState(false)`.

## Plan de implementación

1. Crear `src/components/MultiSelect.tsx` con la interface `MultiSelectOption`, las props anteriores y el estado `abierto`. Estructura: contenedor `position: relative` → cabecera (chips + `+`) → lista desplegable condicionada a `abierto` → inputs ocultos. Prueba: `npx tsc --noEmit` sin errores nuevos.
2. Cabecera: `onClick` en el contenedor de la cabecera que hace `setAbierto((prev) => !prev)`. Cada chip renderiza su `label` y un `<button type="button">` con la `X`, cuyo `onClick` hace `e.stopPropagation()` y llama a `onChange(selected.filter(...))`. Si `selected` está vacío, se pinta el `placeholder`. Prueba: pulsar la `X` de un chip lo elimina y el desplegable no cambia de estado.
3. Lista desplegable: un `<label>` por opción con `<input type="checkbox" checked={selected.includes(o.id)} />`; al marcar añade el id a `selected`, al desmarcar lo quita. Las opciones seleccionadas siguen en la lista, con el check puesto. Los checkboxes **no** llevan `name`. Prueba: desmarcar en la lista una opción hace desaparecer su chip de la cabecera, y viceversa.
4. Inputs ocultos: `selected.map((id) => <input type="hidden" name={name} value={id} key={id} />)`, siempre montados esté abierto o cerrado el desplegable. Prueba: enviar el form con el desplegable cerrado sigue mandando las tecnologías.
5. Crear `src/components/MultiSelect.module.scss`: contenedor `position: relative` y ancho `100%`; cabecera en `flex` con `flex-wrap: wrap`, borde y `justify-content: space-between` para dejar el `+` a la derecha; chips con borde propio y su botón `X` sin heredar anchos del formulario; lista con `position: absolute; top: 100%; left: 0; right: 0; z-index: 10; max-height: 200px; overflow-y: auto;` y fondo opaco. Prueba: con muchas tecnologías aparece scroll interno y la lista no empuja hitos ni Submit.
6. En `ExperienciaForm.tsx`, borrar `showCheckboxes`, la variable `expanded` y todo el bloque `div.multiselect`, y poner en su lugar un bloque `div.tecnologias` con `<label>Tecnologías:</label>` y `<MultiSelect name="tecnologias" ... />`. Se mantiene el `useEffect` que llama a `getConocimiento` y el fallback `No technologies available`. Prueba: el form carga sin errores en consola y muestra el label.
7. Limpiar `Form.module.scss`: eliminar `.multiselect` con todo su contenido y la regla suelta `.show`; añadir `.tecnologias` (columna, `gap: 0.5rem`) siguiendo el patrón de `.hitos`. Prueba: visual, ningún otro campo del form se descuadra.
8. Comprobación end to end: crear una experiencia con tres tecnologías, quitar una con su `X` antes de enviar, y verificar en el `console.log` del hook que el payload lleva exactamente las dos restantes y que la card las muestra.
9. Incluir opciones de accesibilidad: navegación con teclado y roles ARIA; click fuera cierra el desplegable.

## Criterios de aceptación

- [ ] El bloque de tecnologías muestra el label `Tecnologías:` encima del componente.
- [ ] Con ninguna tecnología seleccionada, la cabecera muestra el placeholder y el botón `+`.
- [ ] Un clic en cualquier zona de la cabecera (hueco vacío, `+` o cuerpo de un chip) abre el desplegable; otro clic lo cierra.
- [ ] Un clic en la `X` de un chip elimina esa tecnología y **no** abre ni cierra el desplegable.
- [ ] La `X` de un chip no envía el formulario.
- [ ] Marcar una opción en la lista añade su chip a la cabecera; desmarcarla lo quita.
- [ ] Las tecnologías ya seleccionadas siguen apareciendo en la lista, con el checkbox marcado.
- [ ] Con más opciones de las que caben en 200px, la lista muestra scroll vertical propio y la página no crece.
- [ ] Abrir y cerrar el desplegable no desplaza hacia abajo el bloque de hitos ni el botón Submit.
- [ ] El desplegable se pinta por encima de los campos siguientes, no por debajo.
- [ ] Enviar el form con el desplegable cerrado manda igualmente las tecnologías seleccionadas.
- [ ] El payload del `POST /api/experiencia` sigue llevando `tecnologias` como array de ids, sin cambios en `useExperienciaStore`.
- [ ] Una tecnología eliminada con su `X` antes de enviar no llega en el payload.
- [ ] Ya no existen en `Form.module.scss` las clases `.multiselect`, `.selectBox`, `.overSelect`, `.checkboxes` ni `.show`.
- [ ] `npx tsc --noEmit` no reporta errores nuevos.
- [ ] Hacer click fuera cierra el desplegable.
- [ ] Se puede navegar con las flechas de cursor arriba y abajo por las opciones.

## Decisiones

- **Sí:** extraer `src/components/MultiSelect.tsx` reutilizable, junto a `Button.tsx` y con fichero plano (no carpeta), siguiendo la convención actual del proyecto.
- **Sí:** componente controlado (`selected` + `onChange`). `ExperienciaForm` ya tiene el estado `selectedTecnologias`; hacerlo no controlado obligaría a leer el DOM para saber qué hay seleccionado.
- **Sí:** props genéricas `MultiSelectOption { id, label }` en vez de recibir `Conocimiento[]`. El componente no debe conocer el dominio si se va a reutilizar.
- **Sí:** inputs ocultos con `name="tecnologias"`. `createExperiencia` sigue haciendo `formData.getAll("tecnologias")` sin ningún cambio, y el envío no depende de que la lista esté montada.
- **No:** dejar los checkboxes de la lista como inputs del formulario. Al desmontarse la lista al cerrar el desplegable, las selecciones dejarían de llegar en el `FormData`.
- **No:** elevar el array y construir el payload a mano en el form. Cambiaría la firma de `onAddExperiencia` y el hook, para el mismo resultado.
- **Sí:** toda la cabecera clicable, con `stopPropagation` solo en la `X` de los chips. Evita zonas muertas; el `+` es una pista visual, no la única zona activa.
- **Sí:** desplegable flotante con `position: absolute` y `z-index`. Abrir el selector no debe hacer saltar el resto del formulario.
- **Sí:** `max-height: 200px` en lugar de altura fija. Con tres tecnologías no queda un hueco vacío, y con veinte aparece scroll.
- **Sí:** las opciones seleccionadas se quedan en la lista con el check puesto, como en el boceto. Ocultarlas haría que la lista cambiara de tamaño al seleccionar y se perdería la referencia.
- **Sí:** sustituir el `<select>` decorativo y el `.overSelect` por divs. El markup actual finge ser un `select` nativo que nunca se usa, y estorba para estilar la cabecera.
- **Sí:** pasar el toggle a `useState`. La variable `expanded` se reinicializaba en cada render y el toggle manipulaba el DOM con `getElementById`, fuera del control de React.
- **Sí:** cierre al hacer clic fuera. Requiere listener global y `ref`.
- **Sí:** navegación por teclado y roles ARIA.
- **No:** buscador dentro del desplegable. El número de conocimientos es pequeño; con scroll basta.

## Riesgos

| Riesgo                                                                                                | Mitigación                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La `X` de un chip burbujea al `onClick` de la cabecera y abre/cierra el desplegable al borrar         | `e.stopPropagation()` en el handler de la `X` (paso 2), con criterio de aceptación específico.                                                                        |
| Los botones del chip heredan `button { width: 100px }` de `.Form` y deforman los chips                | Los estilos viven en `MultiSelect.module.scss` con ancho explícito, y la especificidad de la clase propia gana al selector de elemento.                               |
| Al cerrar el desplegable se pierden las selecciones si los inputs viven dentro de la lista            | Los inputs ocultos están fuera del bloque condicionado a `abierto` (paso 4).                                                                                          |
| El desplegable queda por detrás de los campos siguientes o recortado por un `overflow` del contenedor | `z-index` en la lista y contenedor sin `overflow: hidden`; criterio de aceptación que lo verifica visualmente.                                                        |
| Eliminar `.show` y `.multiselect` de `Form.module.scss` rompe algún otro form que las usara           | Son clases de módulo, solo alcanzables desde quien importa `Form.module.scss`; se comprueba con una búsqueda de `styles.show` y `styles.multiselect` antes de borrar. |
| Un `<button>` sin `type` dentro del form envía el formulario                                          | Todos los botones del componente (`X` y `+`) llevan `type="button"`.                                                                                                  |
