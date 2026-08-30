# SPEC 03 — Editar experiencia desde la card

> **Estado:** Implementada
> **Depende de:** SPEC 02 del frontend (`02-multiselect-tecnologias.md`, Aprobada) y SPEC 02 del backend (`../amm-curriculum-vitae-backend/specs/02-editar-experiencia.md`, Borrador)
> **Fecha:** 2026-08-28
> **Objetivo:** Añadir un botón `Editar` en cada `ExperienciaCard` que cargue esa experiencia en el formulario para actualizarla vía `PUT`, y un botón `Borrar formulario` que limpie los campos y desvincule el id.

## Alcance

**Dentro:**

- Botón `Editar` en `ExperienciaCard`, a la izquierda de `Delete`.
- Estado `experienciaEnEdicion` en `Experiencia.tsx`, que se pasa al formulario y a las cards.
- `ExperienciaForm` pasa a ser un formulario **controlado** (`empresa`, `descripcion`, `fechaInicio`, `fechaFin`, `tecnologias`, `hitos`), y deja de usar `FormData`.
- Los hitos del formulario pasan de `string[]` a `{ id?: string; descripcion: string }[]`, para poder mandar los ids al backend.
- Botón `Borrar formulario` bajo el de submit: vacía todos los campos y pone `experienciaEnEdicion` a `null`.
- El título de la sección pasa de `Crear Experiencia` a `Editar Experiencia` y el botón de submit de `Submit` a `Actualizar` cuando hay una experiencia cargada.
- La card en edición se resalta con una clase propia.
- `useExperienciaStore`: nueva función `updateExperiencia(id, payload)` que hace `PUT /experiencia/:id` y reemplaza el elemento en el store; `createExperiencia` cambia de firma para recibir el objeto en vez de `FormData`.
- Nuevos tipos en `interfaces/experiencia.interface.ts` para el payload del formulario.

**Fuera de alcance (para futuras specs):**

- Edición de `Formacion`, `FormacionComplementaria`, `Conocimiento` y `Perfil`: sus cards y forms no se tocan.
- Confirmación antes de descartar cambios sin guardar (pulsar `Editar` en otra card o `Borrar formulario` con el form sucio).
- Scroll automático hasta el formulario al pulsar `Editar`.
- Validación de campos en cliente más allá del `required` que ya existe.
- Mostrar errores del backend en la interfaz: se siguen registrando con `console.error`, como el resto del hook.
- Borrar `actions/Experiencia/createExperiencia.action.ts`: no lo usa nadie y su limpieza va aparte.
- Estado de edición en Redux: se queda como estado local de la página.
- Reordenar los hitos dentro del formulario.

## Modelo de datos

No hay persistencia nueva. Se añaden dos tipos en `interfaces/experiencia.interface.ts`:

```ts
export interface HitoForm {
  id?: string;
  descripcion: string;
}

export interface ExperienciaPayload {
  empresa: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  tecnologias: string[];
  hitos: HitoForm[];
}
```

Estado local de `ExperienciaForm`:

```ts
const [empresa, setEmpresa] = useState("");
const [descripcion, setDescripcion] = useState("");
const [fechaInicio, setFechaInicio] = useState("");
const [fechaFin, setFechaFin] = useState("");
const [selectedTecnologias, setSelectedTecnologias] = useState<string[]>([]);
const [hitos, setHitos] = useState<HitoForm[]>([{ descripcion: "" }]);
```

Props de `ExperienciaForm`:

```ts
interface Props {
  experienciaEnEdicion: Experiencia | null;
  onSubmitExperiencia: (payload: ExperienciaPayload) => Promise<void>;
  onLimpiar: () => void;
}
```

Props nuevas de `ExperienciaCard`:

```ts
interface Props {
  experiencia: Experiencia;
  deleteExperiencia: (id: string) => void;
  onEditar: (experiencia: Experiencia) => void;
  enEdicion: boolean;
}
```

Mapeo de `Experiencia` (API) → estado del formulario, al entrar en modo edición:

| Campo del form | Origen |
| --- | --- |
| `empresa` | `experiencia.empresa` |
| `descripcion` | `experiencia.descripcion` |
| `fechaInicio` | `experiencia.fechaInicio.slice(0, 10)` — el input `type="date"` exige `YYYY-MM-DD` y la API devuelve ISO completo |
| `fechaFin` | `experiencia.fechaFin ? experiencia.fechaFin.slice(0, 10) : ""` |
| `selectedTecnologias` | `experiencia.tecnologias` (ya es `string[]` de ids) |
| `hitos` | `experiencia.hitos.map(({ id, descripcion }) => ({ id, descripcion }))`, o `[{ descripcion: "" }]` si no tiene ninguno |

## Plan de implementación

1. Añadir `HitoForm` y `ExperienciaPayload` a `interfaces/experiencia.interface.ts`. Prueba: `npx tsc --noEmit` sin errores nuevos.
2. En `useExperienciaStore`, cambiar `createExperiencia` para que reciba un `ExperienciaPayload` y lo mande tal cual con `api.post("/experiencia", payload)`, eliminando el `Object.fromEntries` y los `formData.getAll`. Prueba: crear una experiencia sigue funcionando y el `console.log` del payload muestra `hitos` como array de objetos.
3. En `useExperienciaStore`, añadir `updateExperiencia(id, payload)`: `api.put(\`/experiencia/${id}\`, payload)` y, con la experiencia poblada de la respuesta, `dispatch(setExperiencia(experiencia.map((e) => (e.id === data.id ? data : e))))`. Exportarla en el objeto de retorno. Prueba: llamarla a mano desde la consola actualiza la card sin recargar.
4. Convertir `ExperienciaForm` a controlado: un `useState` por campo, `value` + `onChange` en cada input, y `hitos` como `HitoForm[]` (`cambiarHito` actualiza solo `descripcion` y conserva el `id`). Sustituir `useActionState` por un `onSubmit` con `e.preventDefault()` y un `isPending` propio (`useState<boolean>`), porque ya no hay `FormData` que enviar. Los inputs ocultos del `MultiSelect` dejan de ser necesarios para el envío, pero el componente no se toca: se sigue leyendo `selectedTecnologias`. Prueba: crear una experiencia nueva desde el form funciona igual que antes.
5. Añadir a `ExperienciaForm` la prop `experienciaEnEdicion` y un `useEffect` con dependencia `[experienciaEnEdicion]` que rellene los seis estados según la tabla de mapeo, o los vacíe si es `null`. Prueba: pulsar `Editar` en una card rellena todos los campos, incluidos tecnologías e hitos.
6. Añadir la función `limpiarFormulario()` en `ExperienciaForm`, que vacía los seis estados y llama a `props.onLimpiar()`. Renderizar bajo el botón de submit un `<button type="button">Borrar formulario</button>` que la invoque. Prueba: con una experiencia cargada, pulsarlo deja el form vacío y el título vuelve a `Crear Experiencia`.
7. En el submit de `ExperienciaForm`, montar el `ExperienciaPayload` desde el estado (descartando los hitos con `descripcion` vacía tras `trim`) y llamar a `onSubmitExperiencia`. Al terminar con éxito, llamar a `limpiarFormulario()`. El texto del botón es `Actualizar` / `Updating...` si hay `experienciaEnEdicion`, y `Submit` / `Submitting...` si no. Prueba: editar una experiencia y guardar deja el form vacío y la card actualizada.
8. En `ExperienciaCard`, añadir las props `onEditar` y `enEdicion`, y un `<button onClick={() => onEditar(experiencia)}>Editar</button>` **antes** del de `Delete` dentro de `.actions`. Aplicar la clase de resaltado al `.Card` cuando `enEdicion` es `true`. Prueba: el botón aparece a la izquierda de `Delete` y la card se resalta.
9. En `Cards.module.scss`, añadir dentro de `.Card` una clase `.actionsFila` (`flex-direction: row`) que use solo `ExperienciaCard` junto a `.actions`, y una clase `.enEdicion` con el borde/fondo de resaltado. No se modifica `.actions`, que la comparten las demás cards. Prueba: las cards de Formación y Conocimiento siguen con sus botones en columna.
10. En `Experiencia.tsx`, añadir `const [experienciaEnEdicion, setExperienciaEnEdicion] = useState<IExperiencia | null>(null)`, pasar `onEditar={setExperienciaEnEdicion}` y `enEdicion={exp.id === experienciaEnEdicion?.id}` a cada card, y al form `experienciaEnEdicion`, `onLimpiar={() => setExperienciaEnEdicion(null)}` y un `onSubmitExperiencia` que llame a `updateExperiencia(experienciaEnEdicion.id, payload)` si hay experiencia en edición y a `createExperiencia(payload)` si no. El `h1` muestra `Editar Experiencia` o `Crear Experiencia` según el estado. Prueba: el ciclo completo editar → guardar → volver a crear funciona sin recargar la página.
11. Comprobación end to end: crear una experiencia con tres hitos, editarla cambiando empresa, quitando un hito, editando otro y añadiendo uno nuevo, y verificar en la respuesta del `PUT` que el hito editado conserva su `id` y que solo hay tres hitos.

## Criterios de aceptación

- [ ] Cada `ExperienciaCard` muestra un botón `Editar` a la izquierda del botón `Delete`.
- [ ] Pulsar `Editar` rellena empresa, posición, fecha de inicio y fecha de fin con los valores de esa experiencia.
- [ ] Las fechas se cargan en los inputs `type="date"` sin quedar vacías (formato `YYYY-MM-DD`).
- [ ] Una experiencia sin `fechaFin` carga el campo de fecha de fin vacío.
- [ ] Las tecnologías de la experiencia aparecen como chips seleccionados en el `MultiSelect`.
- [ ] Los hitos de la experiencia aparecen, uno por fila, en el bloque de hitos.
- [ ] Una experiencia sin hitos carga una única fila de hito vacía.
- [ ] Con una experiencia cargada, el título de la sección dice `Editar Experiencia`.
- [ ] Con una experiencia cargada, el botón de submit dice `Actualizar`.
- [ ] La card que se está editando se distingue visualmente de las demás.
- [ ] Pulsar `Editar` en una segunda card sustituye el contenido del formulario por el de esa card y mueve el resaltado.
- [ ] Guardar en modo edición lanza `PUT /api/experiencia/:id`, no `POST`.
- [ ] Tras guardar en modo edición, la card refleja los cambios sin recargar la página y sin una llamada extra a `GET /experiencia`.
- [ ] Tras guardar, el formulario queda vacío y en modo creación.
- [ ] Un hito editado conserva su `id` en la respuesta del `PUT`.
- [ ] Un hito borrado en el formulario desaparece de la card tras guardar.
- [ ] Un hito añadido en el formulario aparece en la card tras guardar.
- [ ] Existe un botón `Borrar formulario` debajo del botón de submit.
- [ ] `Borrar formulario` vacía todos los campos, incluidos tecnologías e hitos.
- [ ] Tras `Borrar formulario`, el título vuelve a `Crear Experiencia` y el submit a `Submit`.
- [ ] Tras `Borrar formulario` en modo edición, el siguiente envío crea una experiencia nueva (`POST`), no actualiza la anterior.
- [ ] `Borrar formulario` no envía el formulario (es `type="button"`).
- [ ] Crear una experiencia nueva sigue funcionando con el nuevo payload de objeto.
- [ ] `npx tsc --noEmit` no reporta errores nuevos.
- [ ] Las cards de Formación, Formación Complementaria y Conocimiento no cambian de aspecto.

## Decisiones

- **Sí:** formulario controlado. Con `defaultValue` habría que remontarlo con `key` en cada `Editar`, y aun así `Borrar formulario` necesitaría otro cambio de `key` artificial. Controlado hace que cargar, limpiar y montar el payload sean la misma operación sobre el estado.
- **Sí:** abandonar `FormData` y `useActionState`. Con el form controlado el `FormData` sería una copia del estado, y los hitos con `id` no caben en un `FormData` sin acoplar dos campos por posición de array.
- **Sí:** hitos como `{ id?, descripcion }[]` en el estado del form. Es el requisito de la reconciliación por id del backend; sin el `id`, cada guardado recrearía todos los hitos.
- **Sí:** `experienciaEnEdicion` como `useState` en `Experiencia.tsx`. Es estado de UI efímero, no compartido con otras rutas; meterlo en Redux añadiría una acción y un reducer sin ningún consumidor más.
- **Sí:** un único formulario que alterna entre crear y editar, en vez de un formulario o modal aparte. Los campos son los mismos y el usuario pidió explícitamente que `Editar` cargue los datos en el formulario existente.
- **Sí:** `Borrar formulario` visible siempre, no solo en edición. También sirve para descartar lo escrito al crear, y una segunda variante contextual sería más código para el mismo botón.
- **Sí:** `Borrar formulario` desvincula el id (`onLimpiar` → `setExperienciaEnEdicion(null)`). Es lo que pidió el usuario: limpiar los campos sin desvincular dejaría un formulario vacío que al enviarse borraría el contenido de la experiencia editada.
- **Sí:** limpiar el formulario automáticamente tras guardar. Deja la interfaz en un estado inequívoco y evita que un segundo submit accidental repita el `PUT`.
- **Sí:** reemplazar el elemento en el store con la respuesta del `PUT`, en vez de recargar con `getExperiencia()`. Mismo patrón que `deleteExperiencia`, sin request extra ni parpadeo de la lista.
- **No:** acción `updateExperiencia` en `experienciaSlice`. `setExperiencia` con el array recalculado en el hook es lo que ya hace `deleteExperiencia`; introducir un reducer nuevo rompería la simetría.
- **No:** scroll automático al formulario. Hoy hay pocas cards y el formulario está a la vista; se deja para otra spec si molesta.
- **No:** confirmación al descartar cambios sin guardar. Añade un diálogo y estado de "form sucio" que no se han pedido.
- **Sí:** clase `.actionsFila` nueva en vez de cambiar `.actions` a `flex-direction: row`. `.actions` la comparten las cuatro cards; cambiarla movería los botones de Formación, Formación Complementaria y Conocimiento sin haberlo pedido.
- **No:** tocar `MultiSelect`. Ya es controlado (`selected` + `onChange`), así que cargar tecnologías en edición es asignar el array de ids; sus inputs ocultos quedan inertes pero inofensivos.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La API devuelve `fechaInicio` en ISO completo y el input `type="date"` lo rechaza, quedando vacío | Mapeo explícito con `.slice(0, 10)` documentado en la tabla, y criterio de aceptación que verifica que las fechas se cargan. |
| Guardar en modo edición dispara un `POST` y duplica la experiencia | `Experiencia.tsx` decide entre `createExperiencia` y `updateExperiencia` según `experienciaEnEdicion`, y hay criterio de aceptación explícito de que se lanza `PUT`. |
| Limpiar el formulario sin desvincular el id provoca un `PUT` que vacía la experiencia editada | `limpiarFormulario` llama siempre a `onLimpiar()`, que pone `experienciaEnEdicion` a `null`. Criterio de aceptación específico. |
| Los hitos pierden su `id` al pasar por el estado del form y el backend los recrea en cada guardado | El estado guarda `HitoForm` con `id` opcional y `cambiarHito` solo toca `descripcion`. Se verifica en el paso 11 comprobando que el `id` se conserva. |
| El backend aún no tiene el `PUT` desplegado y la edición falla con 404 de ruta | Esta spec depende de la SPEC 02 del backend; se implementa después. El error se ve en el `console.error` del hook. |
| Cambiar la firma de `createExperiencia` rompe otro consumidor del hook | `useExperienciaStore` solo lo consume `Experiencia.tsx`; se comprueba con una búsqueda de `createExperiencia` antes de tocarlo. `createExperiencia.action.ts` es código muerto y no usa el hook. |
| Quitar `useActionState` pierde el estado `isPending` que deshabilita el submit | Se sustituye por un `useState<boolean>` propio, puesto a `true` antes del `await` y a `false` en el `finally`. |
| El botón `Borrar formulario` envía el formulario al no llevar `type` | `type="button"` explícito, con criterio de aceptación propio, igual que se hizo con los botones de hitos y del `MultiSelect`. |
