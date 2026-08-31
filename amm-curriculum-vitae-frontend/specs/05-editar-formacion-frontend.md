# SPEC 05 — Editar formación desde la card

> **Estado:** Aprobada
> **Depende de:** SPEC 04 del frontend (`04-editar-conocimiento-frontend.md`, Implementada) y SPEC 04 del backend (`../amm-curriculum-vitae-backend/specs/04-editar-formacion.md`, Borrador)
> **Fecha:** 2026-08-31
> **Objetivo:** Añadir un botón `Editar` en cada `FormacionCard` que cargue esa formación en el formulario para actualizarla vía `PUT`, y un botón `Borrar formulario` que limpie los campos y desvincule el id, replicando el patrón de la SPEC 04.

## Alcance

**Dentro:**

- Botón `Editar` en `FormacionCard`, a la izquierda de `Eliminar`, con la clase `.actionsFila` que ya usan `ExperienciaCard` y `ConocimientoCard`.
- Estado `formacionEnEdicion` en `Formacion.tsx`, que se pasa al formulario y a las cards.
- `FormacionForm` pasa a ser un formulario **controlado** (`titulo`, `institucion`, `descripcion`, `fechaFin`), y deja de usar `FormData` y `useActionState`.
- Botón `Borrar formulario` junto al de submit: vacía los campos y pone `formacionEnEdicion` a `null`.
- El título de la sección pasa de `Crear Formación` a `Editar Formación`, y el botón de submit de `Agregar Formación` a `Actualizar Formación`, cuando hay una formación cargada.
- La card en edición se resalta con la clase `.enEdicion` ya existente en `Cards.module.scss`.
- `useFormacionStore`: nueva función `updateFormacion(id, payload)` que hace `PUT /formacion/:id` y reemplaza el elemento en el store; `createFormacion` cambia de firma para recibir un `FormacionPayload` en vez de `FormData`.
- `Formacion.fechaFin` pasa de `Date` a `string` en `interfaces/formacion.interface.ts`, que es lo que devuelve la API (ISO completo) y lo que necesita el input `type="date"`.
- Nuevo tipo `FormacionPayload` en `interfaces/formacion.interface.ts`.

**Fuera de alcance (para futuras specs):**

- Edición de `FormacionComplementaria`: va en la SPEC 06 del frontend.
- Edición de `Perfil`: su card y su form no se tocan.
- `Conocimiento`, `Experiencia` y sus cards y forms: no consumen `useFormacionStore`.
- Cambiar `initialState: null` del `formacionSlice` ni el `formacion === null` de `Formacion.tsx` por el patrón de array vacío de conocimiento.
- Cambiar el texto del botón `Eliminar` a `Delete` para igualarlo al de las otras entidades.
- Confirmación antes de descartar cambios sin guardar.
- Scroll automático hasta el formulario al pulsar `Editar`.
- Validación de campos en cliente más allá del `required` que ya existe.
- Mostrar errores del backend en la interfaz: se siguen registrando con `console.error`, como el resto del hook.
- Estado de edición en Redux: se queda como estado local de la página.
- Ordenar las formaciones por fecha en el listado.
- Cambios en `Cards.module.scss` y `Form.module.scss`: `.actionsFila`, `.enEdicion` y `.actions` ya existen.

## Modelo de datos

No hay persistencia nueva. En `interfaces/formacion.interface.ts` se corrige el tipo de `fechaFin` y se añade `FormacionPayload` reutilizando `Formacion`, sin declarar sus campos por separado:

```ts
export interface Formacion {
  id: string;
  titulo: string;
  institucion: string;
  descripcion?: string;
  fechaFin: string;
}

export interface FormacionPayload extends Omit<Formacion, 'id'> {}
```

`fechaFin` era `Date` pero en runtime siempre ha sido un string ISO venido de la API; `FormacionCard` ya hace `new Date(fechaFin)`, que sigue funcionando igual.

Estado local de `FormacionForm`:

```ts
const FORMACION_VACIA: FormacionPayload = {
  titulo: '',
  institucion: '',
  descripcion: '',
  fechaFin: '',
};

const [formacion, setFormacion] = useState<FormacionPayload>(FORMACION_VACIA);
const [isPending, setIsPending] = useState<boolean>(false);
```

Un único estado con la forma del payload, no un `useState` por campo: mismo criterio que `ExperienciaForm` y `ConocimientoForm`.

Props de `FormacionForm`:

```ts
interface Props {
  formacionEnEdicion: Formacion | null;
  onAddFormacion: (payload: FormacionPayload) => Promise<void> | void;
  onLimpiar: () => void;
}
```

Props nuevas de `FormacionCard`:

```ts
interface Props {
  formacion: Formacion;
  deleteFormacion: (id: string) => void;
  onEditar: (formacion: Formacion) => void;
  enEdicion: boolean;
}
```

Mapeo de `Formacion` (API) → estado del formulario, al entrar en modo edición:

| Campo del form | Origen                                                                                 |
| -------------- | -------------------------------------------------------------------------------------- |
| `titulo`       | `formacion.titulo`                                                                     |
| `institucion`  | `formacion.institucion`                                                                |
| `descripcion`  | `formacion.descripcion ?? ""` — el campo es opcional y el input controlado no admite `undefined` |
| `fechaFin`     | `formacion.fechaFin.slice(0, 10)` — el input `type="date"` exige `YYYY-MM-DD` y la API devuelve ISO completo |

Al salir de edición (`formacionEnEdicion === null`): los cuatro campos vuelven a `FORMACION_VACIA`.

## Plan de implementación

1. En `interfaces/formacion.interface.ts`, cambiar `fechaFin` a `string` y añadir `FormacionPayload`. Prueba: `npx tsc --noEmit` sin errores nuevos.
2. En `useFormacionStore`, cambiar `createFormacion` para que reciba un `FormacionPayload` y lo mande tal cual con `api.post("/formacion", payload)`. Prueba: crear una formación desde el form guarda los cuatro campos en Mongo, no un documento vacío.
3. En `useFormacionStore`, añadir `updateFormacion(id, payload)`: `api.put(`/formacion/${id}`, payload)` y `dispatch(setFormacion(formacion.map((f: Formacion) => (f.id === data.id ? data : f))))`, con el `try/catch` y el `console.error` del resto del hook. Exportarla en el objeto de retorno. Prueba: llamarla a mano desde la consola actualiza la card sin recargar.
4. Convertir `FormacionForm` a controlado: `value` + `onChange` en los cuatro inputs. Sustituir `useActionState` por un `onSubmit` con `e.preventDefault()` y un `isPending` propio (`useState<boolean>`), puesto a `true` antes del `await` y a `false` en el `finally`. Corregir de paso el `htmlFor="institucion"` duplicado de la etiqueta de descripción, que debe ser `htmlFor="descripcion"`. Prueba: crear una formación nueva desde el form funciona igual que antes.
5. Añadir a `FormacionForm` la prop `formacionEnEdicion` y un `useEffect` con dependencia `[formacionEnEdicion]` que rellene el estado según la tabla de mapeo, o lo devuelva a `FORMACION_VACIA` si es `null`. Prueba: pulsar `Editar` en una card rellena los cuatro campos, incluida la fecha.
6. Añadir la función `limpiarFormulario()` en `FormacionForm`, que devuelve el estado a `FORMACION_VACIA` y llama a `props.onLimpiar()`. Renderizar junto al botón de submit un `<button type="button">Borrar formulario</button>` que la invoque. Prueba: con una formación cargada, pulsarlo deja el form vacío y el título vuelve a `Crear Formación`.
7. En el submit de `FormacionForm`, montar el `FormacionPayload` desde el estado (con `titulo.trim()` e `institucion.trim()`) y llamar a `onAddFormacion`. Al terminar con éxito, llamar a `limpiarFormulario()`. El texto del botón es `Actualizar Formación` / `Actualizando...` si hay `formacionEnEdicion`, y `Agregar Formación` / `Agregando...` si no. Prueba: editar una formación y guardar deja el form vacío y la card actualizada.
8. En `FormacionCard`, añadir las props `onEditar` y `enEdicion`, un `<button onClick={() => onEditar(formacion)}>Editar</button>` **antes** del de `Eliminar` dentro de `.actions`, la clase `.actionsFila` junto a `.actions` y la clase `.enEdicion` en el `.Card` cuando `enEdicion` es `true`. Prueba: el botón aparece a la izquierda de `Eliminar` y la card se resalta.
9. En `Formacion.tsx`, añadir `const [formacionEnEdicion, setFormacionEnEdicion] = useState<IFormacion | null>(null)`, pasar `onEditar={setFormacionEnEdicion}` y `enEdicion={f.id === formacionEnEdicion?.id}` a cada card, y al form `formacionEnEdicion`, `onLimpiar={() => setFormacionEnEdicion(null)}` y un `enviarFormacion` que llame a `updateFormacion(formacionEnEdicion.id, payload)` si hay formación en edición y a `createFormacion(payload)` si no. El `h1` muestra `Editar Formación` o `Crear Formación` según el estado. Prueba: el ciclo completo editar → guardar → volver a crear funciona sin recargar la página.
10. Comprobación end to end: crear una formación, editarla cambiando los cuatro campos, borrar la descripción dejándola vacía, y verificar en `/curriculum` que los datos nuevos aparecen y que la descripción vacía no pinta el bloque `Descripción:`.

## Criterios de aceptación

- [ ] Cada `FormacionCard` muestra un botón `Editar` a la izquierda del botón `Eliminar`, en la misma fila.
- [ ] Pulsar `Editar` rellena `titulo`, `institucion`, `descripcion` y `fechaFin` con los valores de esa formación.
- [ ] La fecha se carga en el input `type="date"` sin quedar vacía (formato `YYYY-MM-DD`).
- [ ] Una formación sin `descripcion` carga el campo de descripción vacío, no con `undefined`.
- [ ] Con una formación cargada, el título de la sección dice `Editar Formación`.
- [ ] Con una formación cargada, el botón de submit dice `Actualizar Formación`.
- [ ] La card que se está editando se distingue visualmente de las demás.
- [ ] Pulsar `Editar` en una segunda card sustituye el contenido del formulario por el de esa card y mueve el resaltado.
- [ ] Guardar en modo edición lanza `PUT /api/formacion/:id`, no `POST`.
- [ ] Tras guardar en modo edición, la card refleja los cambios sin recargar la página y sin una llamada extra a `GET /formacion`.
- [ ] Tras guardar, el formulario queda vacío y en modo creación.
- [ ] Existe un botón `Borrar formulario` junto al botón de submit.
- [ ] `Borrar formulario` vacía los cuatro campos.
- [ ] Tras `Borrar formulario`, el título vuelve a `Crear Formación` y el submit a `Agregar Formación`.
- [ ] Tras `Borrar formulario` en modo edición, el siguiente envío crea una formación nueva (`POST`), no actualiza la anterior.
- [ ] `Borrar formulario` no envía el formulario (es `type="button"`).
- [ ] Crear una formación nueva sigue funcionando y el `POST` viaja como JSON (`{ titulo, institucion, descripcion, fechaFin }`), no como `multipart/form-data`.
- [ ] Borrar una formación sigue funcionando y la card desaparece de la lista.
- [ ] La etiqueta de descripción apunta a `descripcion`, y hacer clic en ella enfoca ese input.
- [ ] `npx tsc --noEmit` no reporta errores nuevos.
- [ ] Las cards de Experiencia, Conocimiento y Formación Complementaria no cambian de aspecto.

## Decisiones

- **Sí:** replicar el patrón completo de las SPEC 03 y 04 (form controlado, `Editar`, `Borrar formulario`, resaltado, título y botón contextuales). Las páginas quedan con la misma interacción y el usuario no tiene que aprender otro flujo.
- **Sí:** formulario controlado. Con `defaultValue` habría que remontar el form con `key` en cada `Editar`, y `Borrar formulario` necesitaría otro cambio de `key` artificial.
- **Sí:** abandonar `FormData` y `useActionState`. El `createFormacion` actual manda el `FormData` crudo a axios, que viaja como `multipart/form-data`, y el backend solo tiene `express.json()`: el `POST` actual no puede estar guardando bien los campos. Pasar a JSON lo arregla de paso, igual que en la SPEC 04.
- **Sí:** cambiar `fechaFin` de `Date` a `string`. En runtime la API siempre devuelve un string ISO; el tipo actual es falso y bloquea el `.slice(0, 10)` que necesita el input `type="date"`. Mismo criterio que `Experiencia.fechaInicio`.
- **Sí:** mapear `descripcion` con `?? ""`. Un input controlado con `value={undefined}` pasa a no controlado y React avisa por consola.
- **Sí:** `formacionEnEdicion` como `useState` en `Formacion.tsx`. Es estado de UI efímero, no compartido con otras rutas; mismo criterio que `experienciaEnEdicion` y `conocimientoEnEdicion`.
- **Sí:** reemplazar el elemento en el store con la respuesta del `PUT`, en vez de recargar con `getFormacion()`. Mismo patrón que `deleteFormacion`, sin request extra ni parpadeo de la lista.
- **Sí:** limpiar el formulario automáticamente tras guardar. Deja la interfaz en un estado inequívoco y evita que un segundo submit accidental repita el `PUT`.
- **Sí:** corregir el `htmlFor="institucion"` de la etiqueta de descripción. Es una línea del mismo bloque que se reescribe para hacerlo controlado.
- **No:** acción `updateFormacion` en `formacionSlice`. `setFormacion` con el array recalculado en el hook es lo que ya hacen `create` y `delete`.
- **No:** cambiar `initialState: null` ni el `formacion === null` de la página por el patrón de array vacío de conocimiento. Funciona, y unificarlo tocaría slice, hook y página por algo ajeno a la edición.
- **No:** renombrar el botón `Eliminar` a `Delete`. Cambio cosmético ajeno a esta spec.
- **No:** confirmación al descartar cambios sin guardar, ni scroll automático al formulario. Se dejaron fuera en las SPEC 03 y 04 y se mantiene la simetría.

## Riesgos

| Riesgo                                                                                        | Mitigación                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cambiar `fechaFin` a `string` rompe otro consumidor tipado como `Date`                        | El único uso fuera del form es `new Date(fechaFin)` en `FormacionCard`, que acepta string; el paso 1 se valida con `npx tsc --noEmit`.                                                             |
| La API devuelve `fechaFin` en ISO completo y el input `type="date"` lo rechaza, quedando vacío | Mapeo explícito con `.slice(0, 10)` documentado en la tabla, con criterio de aceptación que verifica que la fecha se carga.                                                                        |
| Cambiar la firma de `createFormacion` rompe otro consumidor del hook                          | `createFormacion` solo lo consume `Formacion.tsx`; se comprueba con una búsqueda de `useFormacionStore` antes de tocarlo.                                                                          |
| Guardar en modo edición dispara un `POST` y duplica la formación                              | `Formacion.tsx` decide entre `createFormacion` y `updateFormacion` según `formacionEnEdicion`, con criterio de aceptación explícito de que se lanza `PUT`.                                         |
| Limpiar el formulario sin desvincular el id provoca un `PUT` que sobrescribe la formación editada | `limpiarFormulario` llama siempre a `onLimpiar()`, que pone `formacionEnEdicion` a `null`. Criterio de aceptación específico.                                                                      |
| El backend aún no tiene el `PUT` desplegado y la edición falla con 404 de ruta                | Esta spec depende de la SPEC 04 del backend; se implementa después. El error se ve en el `console.error` del hook.                                                                                 |
| Quitar `useActionState` pierde el `isPending` que deshabilita el submit                       | Se sustituye por un `useState<boolean>` propio, puesto a `true` antes del `await` y a `false` en el `finally`, igual que en `ExperienciaForm` y `ConocimientoForm`.                                |
| El botón `Borrar formulario` envía el formulario al no llevar `type`                          | `type="button"` explícito, con criterio de aceptación propio.                                                                                                                                      |
| `descripcion` vacía se manda como `""` y sobrescribe la descripción guardada                  | Es el comportamiento decidido en la SPEC 04 del backend: vaciar la descripción es una edición legítima; la card no pinta el bloque cuando está vacía.                                             |
