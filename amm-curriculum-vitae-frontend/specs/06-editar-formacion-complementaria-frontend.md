# SPEC 06 — Editar formación complementaria desde la card

> **Estado:** Aprobada
> **Depende de:** SPEC 05 del frontend (`05-editar-formacion-frontend.md`, Borrador) y SPEC 05 del backend (`../amm-curriculum-vitae-backend/specs/05-editar-formacion-complementaria.md`, Aprobada), que aporta tanto el `PUT` como el campo opcional `fechaFin`
> **Fecha:** 2026-08-31
> **Objetivo:** Añadir un botón `Editar` en cada `FormacionComplementariaCard` que cargue ese registro en el formulario para actualizarlo vía `PUT`, y un botón `Borrar formulario` que limpie los campos y desvincule el id, replicando el patrón de la SPEC 05. Se incorpora además el campo **opcional** `fechaFin`, ya disponible en el backend desde la SPEC 05 del backend.

## Alcance

**Dentro:**

- Botón `Editar` en `FormacionComplementariaCard`, a la izquierda de `Eliminar`, con la clase `.actionsFila` que ya usan las demás cards.
- Estado `formacionComplementariaEnEdicion` en `FormacionComplementaria.tsx`, que se pasa al formulario y a las cards.
- Campo opcional `fechaFin` en toda la cadena del frontend: interfaz, formulario (`<input type="date">` sin `required`) y card (`<b>Fecha:</b>` solo si el registro la tiene, con `dateConverter`).
- `FormacionComplementariaForm` pasa a ser un formulario **controlado** (`titulo`, `institucion`, `fechaFin`), y deja de usar `FormData` y `useActionState`.
- Botón `Borrar formulario` junto al de submit: vacía los campos y pone `formacionComplementariaEnEdicion` a `null`.
- El título de la sección pasa de `Crear Formación Complementaria` a `Editar Formación Complementaria`, y el botón de submit de `Agregar Formación Complementaria` a `Actualizar Formación Complementaria`, cuando hay un registro cargado.
- La card en edición se resalta con la clase `.enEdicion` ya existente en `Cards.module.scss`.
- `useFormacionComplementariaStore`: nueva función `updateFormacionComplementaria(id, payload)` que hace `PUT /formacionComplementaria/:id` y reemplaza el elemento en el store; `createFormacionComplementaria` cambia de firma para recibir un `FormacionComplementariaPayload` en vez de `FormData`.
- Nuevo tipo `FormacionComplementariaPayload` en `interfaces/formacionComplementaria.interface.ts`.
- Corregir las mayúsculas de los imports del interface: `FormacionComplementariaCard.tsx`, `FormacionComplementaria.tsx` y `formacionComplementariaSlice.ts` importan `formacioncomplementaria.interface`, pero el fichero se llama `formacionComplementaria.interface.ts`. Funciona en Windows y rompe en Linux.

**Fuera de alcance (para futuras specs):**

- Edición de `Formacion`: va en la SPEC 05 del frontend.
- Edición de `Perfil`: su card y su form no se tocan.
- `Conocimiento` y `Experiencia`: no consumen `useFormacionComplementariaStore`.
- Cambiar `initialState: null` del `formacionComplementariaSlice` ni el `formacionComplementaria === null` de la página por el patrón de array vacío de conocimiento.
- Renombrar el fichero del interface a `kebab-case` o alinear el nombre con el resto: solo se corrigen las rutas de import al nombre real del fichero.
- Cambiar el texto del botón `Eliminar` a `Delete`.
- Confirmación antes de descartar cambios sin guardar.
- Scroll automático hasta el formulario al pulsar `Editar`.
- Validación de campos en cliente más allá del `required` que ya existe; en particular `fechaFin` **no** lleva `required`.
- Ordenar las formaciones complementarias por `fechaFin`.
- Mostrar `fechaFin` en la vista pública `/curriculum`: aquí solo se toca la card de administración.
- Mostrar errores del backend en la interfaz: se siguen registrando con `console.error`.
- Estado de edición en Redux: se queda como estado local de la página.
- Cambios en `Cards.module.scss` y `Form.module.scss`.

## Modelo de datos

No hay persistencia nueva en el frontend. En `interfaces/formacionComplementaria.interface.ts` se añade el campo opcional `fechaFin` a `FormacionComplementaria` y se declara `FormacionComplementariaPayload` reutilizando la interfaz existente, sin repetir sus campos, igual que hace `formacion.interface.ts`:

```ts
export interface FormacionComplementaria {
  id: string;
  titulo: string;
  institucion: string;
  fechaFin?: string;
}

export interface FormacionComplementariaPayload extends Omit<
  FormacionComplementaria,
  'id'
> {}
```

`fechaFin` se tipa como `string` opcional porque la API la devuelve serializada en ISO 8601 (`"2025-06-30T00:00:00.000Z"`) y el backend omite la propiedad cuando el documento no la tiene.

En el payload, en cambio, `fechaFin` viaja siempre como `string` (`""` cuando no hay fecha): el backend normaliza `""` a `undefined` y hace `$unset` del campo, que es justo lo que permite borrar una fecha ya guardada.

Estado local de `FormacionComplementariaForm`:

```ts
const FORMACION_COMPLEMENTARIA_VACIA: FormacionComplementariaPayload = {
  titulo: '',
  institucion: '',
  fechaFin: '',
};

const [formacionComplementaria, setFormacionComplementaria] =
  useState<FormacionComplementariaPayload>(FORMACION_COMPLEMENTARIA_VACIA);
const [isPending, setIsPending] = useState<boolean>(false);
```

Props de `FormacionComplementariaForm`:

```ts
interface Props {
  formacionComplementariaEnEdicion: FormacionComplementaria | null;
  onSubmitFormacionComplementaria: (
    payload: FormacionComplementariaPayload,
  ) => Promise<void> | void;
  onLimpiar: () => void;
}
```

Props nuevas de `FormacionComplementariaCard`:

```ts
interface Props {
  formacionComplementaria: FormacionComplementaria;
  deleteFormacionComplementaria: (id: string) => void;
  onEditar: (formacionComplementaria: FormacionComplementaria) => void;
  enEdicion: boolean;
}
```

Mapeo de `FormacionComplementaria` (API) → estado del formulario, al entrar en modo edición:

| Campo del form | Origen                                              |
| -------------- | --------------------------------------------------- |
| `titulo`       | `formacionComplementaria.titulo`                     |
| `institucion`  | `formacionComplementaria.institucion`                |
| `fechaFin`     | `formacionComplementaria.fechaFin?.slice(0, 10) ?? ''` |

El `slice(0, 10)` recorta el ISO a `"YYYY-MM-DD"`, que es lo único que acepta un `<input type="date">`; es el mismo mapeo que hace `FormacionForm`, salvo por el `?? ''` que cubre el caso de que no haya fecha.

Al salir de edición (`formacionComplementariaEnEdicion === null`): los tres campos vuelven a `FORMACION_COMPLEMENTARIA_VACIA`.

## Plan de implementación

1. En `interfaces/formacionComplementaria.interface.ts`, añadir `fechaFin?: string` a `FormacionComplementaria` y declarar `FormacionComplementariaPayload`. Prueba: `npx tsc --noEmit` sin errores nuevos.
2. Corregir las mayúsculas de los tres imports (`FormacionComplementariaCard.tsx`, `FormacionComplementaria.tsx`, `formacionComplementariaSlice.ts`) para que apunten a `formacionComplementaria.interface`. Prueba: `grep -r "formacioncomplementaria.interface" src` no devuelve nada y `npx tsc --noEmit` sigue limpio.
3. En `useFormacionComplementariaStore`, cambiar `createFormacionComplementaria` para que reciba un `FormacionComplementariaPayload` y lo mande tal cual con `api.post("/formacionComplementaria", payload)`. Prueba: crear un registro desde el form guarda `titulo` e `institucion` en Mongo, no un documento vacío.
4. En `useFormacionComplementariaStore`, añadir `updateFormacionComplementaria(id, payload)`: `api.put(`/formacionComplementaria/${id}`, payload)` y `dispatch(setFormacionComplementaria(formacionComplementaria.map((f: FormacionComplementaria) => (f.id === data.id ? data : f))))`, con el `try/catch` y el `console.error` del resto del hook. Exportarla en el objeto de retorno. Prueba: llamarla a mano desde la consola actualiza la card sin recargar.
5. Convertir `FormacionComplementariaForm` a controlado: `value` + `onChange` en los inputs, y añadir un tercer campo `<input type="date" id="fechaFin" name="fechaFin">` **sin `required`**, con la etiqueta `Fecha de Fin:`, después de `Institución`, copiando el bloque `.field` de `FormacionForm`. Sustituir `useActionState` por un `onSubmit` con `e.preventDefault()` y un `isPending` propio (`useState<boolean>`), puesto a `true` antes del `await` y a `false` en el `finally`. Prueba: crear un registro nuevo desde el form funciona igual que antes.
6. Añadir a `FormacionComplementariaForm` la prop `formacionComplementariaEnEdicion` y un `useEffect` con dependencia `[formacionComplementariaEnEdicion]` que rellene el estado según la tabla de mapeo, o lo devuelva a `FORMACION_COMPLEMENTARIA_VACIA` si es `null`. Prueba: pulsar `Editar` en una card rellena título e institución.
7. Añadir la función `limpiarFormulario()`, que devuelve el estado a `FORMACION_COMPLEMENTARIA_VACIA` y llama a `props.onLimpiar()`. Renderizar junto al botón de submit un `<button type="button">Borrar formulario</button>` que la invoque. Prueba: con un registro cargado, pulsarlo deja el form vacío y el título vuelve a `Crear Formación Complementaria`.
8. En el submit, montar el `FormacionComplementariaPayload` desde el estado (con `titulo.trim()` e `institucion.trim()`; `fechaFin` va tal cual, `""` incluido) y llamar a `onSubmitFormacionComplementaria`. Al terminar con éxito, llamar a `limpiarFormulario()`. El texto del botón es `Actualizar Formación Complementaria` / `Actualizando...` si hay registro en edición, y `Agregar Formación Complementaria` / `Agregando...` si no. Prueba: editar un registro y guardar deja el form vacío y la card actualizada.
9. En `FormacionComplementariaCard`, mostrar la fecha con `{fechaFin && (<div className={styles.subdata}><b>Fecha:</b> {dateConverter(new Date(fechaFin))}</div>)}` bajo `Institución`, importando `dateConverter` de `../../helpers/dateConverter`, y añadir las props `onEditar` y `enEdicion`, un `<button onClick={() => onEditar(formacionComplementaria)}>Editar</button>` **antes** del de `Eliminar` dentro de `.actions`, la clase `.actionsFila` junto a `.actions` y la clase `.enEdicion` en el `.Card` cuando `enEdicion` es `true`. Prueba: el botón aparece a la izquierda de `Eliminar` y la card se resalta.
10. En `FormacionComplementaria.tsx`, añadir `const [formacionComplementariaEnEdicion, setFormacionComplementariaEnEdicion] = useState<IFormacionComplementaria | null>(null)`, pasar `onEditar={setFormacionComplementariaEnEdicion}` y `enEdicion={f.id === formacionComplementariaEnEdicion?.id}` a cada card, y al form la prop de edición, `onLimpiar` y un `enviarFormacionComplementaria` que llame a `updateFormacionComplementaria(...)` si hay registro en edición y a `createFormacionComplementaria(payload)` si no. El `h1` muestra `Editar Formación Complementaria` o `Crear Formación Complementaria` según el estado. Prueba: el ciclo completo editar → guardar → volver a crear funciona sin recargar la página.
11. Comprobación end to end: crear un registro **sin** fecha, editarlo poniéndole una, editarlo otra vez para quitársela y verificar en `/curriculum` que los valores nuevos aparecen sin recargar y que la card deja de mostrar la línea `Fecha:`.

## Criterios de aceptación

- [ ] Cada `FormacionComplementariaCard` muestra un botón `Editar` a la izquierda del botón `Eliminar`, en la misma fila.
- [ ] Pulsar `Editar` rellena `titulo`, `institucion` y `fechaFin` con los valores de ese registro.
- [ ] El formulario tiene un campo `Fecha de Fin:` de tipo `date` y **no** es obligatorio: se puede enviar vacío.
- [ ] Al editar un registro con fecha, el `<input type="date">` aparece con esa fecha ya seleccionada.
- [ ] Al editar un registro sin fecha, el campo de fecha aparece vacío.
- [ ] La card muestra la línea `Fecha:` con el formato `dd/mm/aaaa` solo cuando el registro tiene `fechaFin`.
- [ ] Guardar con la fecha vaciada la elimina del registro y la línea `Fecha:` desaparece de la card sin recargar.
- [ ] Con un registro cargado, el título de la sección dice `Editar Formación Complementaria`.
- [ ] Con un registro cargado, el botón de submit dice `Actualizar Formación Complementaria`.
- [ ] La card que se está editando se distingue visualmente de las demás.
- [ ] Pulsar `Editar` en una segunda card sustituye el contenido del formulario por el de esa card y mueve el resaltado.
- [ ] Guardar en modo edición lanza `PUT /api/formacionComplementaria/:id`, no `POST`.
- [ ] Tras guardar en modo edición, la card refleja los cambios sin recargar la página y sin una llamada extra a `GET /formacionComplementaria`.
- [ ] Tras guardar, el formulario queda vacío y en modo creación.
- [ ] Existe un botón `Borrar formulario` junto al botón de submit.
- [ ] `Borrar formulario` vacía los dos campos.
- [ ] Tras `Borrar formulario`, el título vuelve a `Crear Formación Complementaria` y el submit a `Agregar Formación Complementaria`.
- [ ] Tras `Borrar formulario` en modo edición, el siguiente envío crea un registro nuevo (`POST`), no actualiza el anterior.
- [ ] `Borrar formulario` no envía el formulario (es `type="button"`).
- [ ] Crear un registro nuevo sigue funcionando y el `POST` viaja como JSON (`{ titulo, institucion, fechaFin }`), no como `multipart/form-data`.
- [ ] Crear un registro sin rellenar la fecha responde 201 y la card aparece sin la línea `Fecha:`.
- [ ] Borrar un registro sigue funcionando y la card desaparece de la lista.
- [ ] Ningún fichero de `src` importa `formacioncomplementaria.interface` en minúsculas.
- [ ] `npx tsc --noEmit` no reporta errores nuevos.
- [ ] Las cards de Experiencia, Conocimiento y Formación no cambian de aspecto.

## Decisiones

- **Sí:** spec separada de la SPEC 05 del frontend aunque el patrón sea idéntico. Son componentes, hook e interface distintos, y así cada entidad se implementa y se revisa por separado.
- **Sí:** replicar el patrón completo de las SPEC 03, 04 y 05 (form controlado, `Editar`, `Borrar formulario`, resaltado, título y botón contextuales).
- **Sí:** formulario controlado, por el mismo motivo que en las specs anteriores: cargar, limpiar y montar el payload son la misma operación sobre el estado.
- **Sí:** abandonar `FormData` y `useActionState`. El `createFormacionComplementaria` actual manda el `FormData` crudo a axios, que viaja como `multipart/form-data`, y el backend solo tiene `express.json()`: el `POST` actual no puede estar guardando bien los campos.
- **Sí:** corregir las mayúsculas de los imports del interface. Se van a tocar los tres ficheros afectados en esta spec y el desajuste rompe cualquier build en un sistema de ficheros sensible a mayúsculas.
- **Sí:** `formacionComplementariaEnEdicion` como `useState` en la página. Estado de UI efímero, no compartido con otras rutas.
- **Sí:** reemplazar el elemento en el store con la respuesta del `PUT`, en vez de recargar con `getFormacionComplementaria()`. Mismo patrón que `delete`, sin request extra ni parpadeo.
- **Sí:** limpiar el formulario automáticamente tras guardar, para evitar que un segundo submit accidental repita el `PUT`.
- **Sí:** meter `fechaFin` en esta spec en vez de en una aparte. El backend ya lo expone (SPEC 05 del backend) y esta spec reescribe de todos modos el formulario, la card y la interfaz: partirlo obligaría a tocar los mismos tres ficheros dos veces.
- **Sí:** `fechaFin` opcional también en el cliente, sin `required` en el input. Es el mismo contrato que el modelo: hay cursos y certificaciones sin fecha de fin registrada.
- **Sí:** mandar `fechaFin: ''` en el payload cuando no hay fecha, en vez de omitir la clave. El backend lo normaliza a `undefined` y hace `$unset`, así que es la única forma de borrar una fecha ya guardada con un `PUT` de reemplazo completo.
- **Sí:** reutilizar `dateConverter` y el patrón `{fechaFin && ...}` de `FormacionCard` para pintarla. Idéntico a como esa card trata `descripcion`, que también es opcional.
- **No:** acción `updateFormacionComplementaria` en el slice. `setFormacionComplementaria` con el array recalculado en el hook es lo que ya hacen `create` y `delete`.
- **No:** renombrar el fichero del interface. Corregir los imports basta y renombrar tocaría también `curriculum.interface.ts`, que ya importa bien.
- **No:** cambiar `initialState: null` ni el render condicional de la página.
- **No:** confirmación al descartar cambios sin guardar, ni scroll automático al formulario. Se mantiene la simetría con las specs anteriores.

## Riesgos

| Riesgo                                                                                           | Mitigación                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cambiar la firma de `createFormacionComplementaria` rompe otro consumidor del hook               | Solo lo consume `FormacionComplementaria.tsx`; se comprueba con una búsqueda de `useFormacionComplementariaStore` antes de tocarlo.                                 |
| Corregir las mayúsculas de los imports rompe la resolución en algún build                        | El fichero real es `formacionComplementaria.interface.ts` y `curriculum.interface.ts` ya lo importa así; el paso 2 se valida con `npx tsc --noEmit` y con la build. |
| Guardar en modo edición dispara un `POST` y duplica el registro                                  | La página decide entre `create` y `update` según el estado de edición, con criterio de aceptación explícito de que se lanza `PUT`.                                  |
| Limpiar el formulario sin desvincular el id provoca un `PUT` que sobrescribe el registro editado | `limpiarFormulario` llama siempre a `onLimpiar()`. Criterio de aceptación específico.                                                                               |
| `new Date(fechaFin)` sobre un registro sin fecha pinta `Invalid Date` en la card                 | La línea va dentro de `{fechaFin && ...}`, con criterio de aceptación propio para el registro sin fecha.                                                             |
| El `<input type="date">` no acepta el ISO completo que devuelve la API y aparece vacío           | El mapeo aplica `fechaFin?.slice(0, 10)`, igual que `FormacionForm`, con criterio de aceptación de que la fecha se ve preseleccionada al editar.                    |
| Vaciar la fecha manda `""` y el backend responde 500 al castear a `Date`                         | El backend normaliza `""` a `undefined` (SPEC 05 del backend); hay criterio de aceptación de que vaciarla borra el campo.                                            |
| El backend aún no tiene el `PUT` desplegado y la edición falla con 404 de ruta                   | Esta spec depende de la SPEC 05 del backend; se implementa después. El error se ve en el `console.error` del hook.                                                  |
| Quitar `useActionState` pierde el `isPending` que deshabilita el submit                          | Se sustituye por un `useState<boolean>` propio, puesto a `true` antes del `await` y a `false` en el `finally`.                                                      |
| El botón `Borrar formulario` envía el formulario al no llevar `type`                             | `type="button"` explícito, con criterio de aceptación propio.                                                                                                       |
