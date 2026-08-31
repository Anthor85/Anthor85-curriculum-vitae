# SPEC 04 — Editar conocimiento desde la card

> **Estado:** Aprobada
> **Depende de:** SPEC 03 del frontend (`03-editar-experiencia-frontend.md`, Implementada) y SPEC 03 del backend (`../amm-curriculum-vitae-backend/specs/03-editar-conocimiento.md`, Borrador)
> **Fecha:** 2026-08-31
> **Objetivo:** Añadir un botón `Editar` en cada `ConocimientoCard` que cargue ese conocimiento en el formulario para actualizarlo vía `PUT`, y un botón `Borrar formulario` que limpie los campos y desvincule el id, replicando el patrón de la SPEC 03.

## Alcance

**Dentro:**

- Botón `Editar` en `ConocimientoCard`, a la izquierda de `Delete`, con la clase `.actionsFila` que ya usa `ExperienciaCard`.
- Estado `conocimientoEnEdicion` en `Conocimiento.tsx`, que se pasa al formulario y a las cards.
- `ConocimientoForm` pasa a ser un formulario **controlado** (`titulo`, `nivel`), y deja de usar `FormData` y `useActionState`.
- Botón `Borrar formulario` bajo el de submit: vacía los campos y pone `conocimientoEnEdicion` a `null`.
- El título de la sección pasa de `Crear Conocimiento` a `Editar Conocimiento`, y el botón de submit de `Agregar Conocimiento` a `Actualizar Conocimiento`, cuando hay un conocimiento cargado.
- La card en edición se resalta con la clase `.enEdicion` ya existente en `Cards.module.scss`.
- `useConocimientoStore`: nueva función `updateConocimiento(id, payload)` que hace `PUT /conocimiento/:id` y reemplaza el elemento en el store; `createConocimiento` cambia de firma para recibir un `ConocimientoPayload` en vez de `FormData`.
- `ConocimientoNivel` se alinea con el `enum` del modelo del backend: `'Básico' | 'Intermedio' | 'Avanzado'`, y el `<select>` del formulario usa el enum en vez de literales sueltos.
- Nuevo tipo `ConocimientoPayload` en `interfaces/conocimiento.interface.ts`.

**Fuera de alcance (para futuras specs):**

- Edición de `Formacion`, `FormacionComplementaria` y `Perfil`: sus cards y forms no se tocan.
- `ExperienciaForm`, `ExperienciaCard` y `Experiencia.tsx`: consumen `useConocimientoStore` solo en lectura (`conocimiento`, `getConocimiento`) y no cambian.
- Confirmación antes de descartar cambios sin guardar.
- Scroll automático hasta el formulario al pulsar `Editar`.
- Validación de campos en cliente más allá del `required` que ya existe.
- Mostrar errores del backend en la interfaz: se siguen registrando con `console.error`, como el resto del hook.
- Estado de edición en Redux: se queda como estado local de la página.
- Migrar los datos ya guardados en Mongo con un `nivel` que no esté en el `enum`.
- Cambios en `Cards.module.scss`: `.actionsFila` y `.enEdicion` ya existen desde la SPEC 03.

## Modelo de datos

No hay persistencia nueva. En `interfaces/conocimiento.interface.ts` se corrigen los valores de `ConocimientoNivel` y se añade `ConocimientoPayload` reutilizando `Conocimiento`, sin declarar sus campos por separado:

```ts
export enum ConocimientoNivel {
  BASICO = 'Básico',
  INTERMEDIO = 'Intermedio',
  AVANZADO = 'Avanzado',
}

export interface ConocimientoPayload extends Omit<Conocimiento, 'id'> {}
```

`Conocimiento` no cambia (`id`, `titulo`, `nivel`).

Estado local de `ConocimientoForm`:

```ts
const CONOCIMIENTO_VACIO: ConocimientoPayload = {
  titulo: '',
  nivel: ConocimientoNivel.BASICO,
};

const [conocimiento, setConocimiento] =
  useState<ConocimientoPayload>(CONOCIMIENTO_VACIO);
const [isPending, setIsPending] = useState(false);
```

Un único estado con la forma del payload, no un `useState` por campo: mismo criterio que `ExperienciaForm`, el payload de envío ya está montado y limpiar el formulario es una sola asignación.

Props de `ConocimientoForm`:

```ts
interface Props {
  conocimientoEnEdicion: Conocimiento | null;
  onAddConocimiento: (payload: ConocimientoPayload) => Promise<void>;
  onLimpiar: () => void;
}
```

Props nuevas de `ConocimientoCard`:

```ts
interface Props {
  conocimiento: Conocimiento;
  deleteConocimiento: (id: string) => void;
  onEditar: (conocimiento: Conocimiento) => void;
  enEdicion: boolean;
}
```

Mapeo de `Conocimiento` (API) → estado del formulario, al entrar en modo edición:

| Campo del form | Origen                                                                |
| -------------- | --------------------------------------------------------------------- |
| `titulo`       | `conocimiento.titulo`                                                 |
| `nivel`        | `conocimiento.nivel`                                                  |

Al salir de edición (`conocimientoEnEdicion === null`): `titulo` a `''` y `nivel` a `ConocimientoNivel.BASICO`, que es la opción por defecto del `<select>` actual.

## Plan de implementación

1. En `interfaces/conocimiento.interface.ts`, cambiar los valores de `ConocimientoNivel` a `'Básico'`, `'Intermedio'` y `'Avanzado'`, y añadir `ConocimientoPayload`. Prueba: `npx tsc --noEmit` sin errores nuevos.
2. En `useConocimientoStore`, cambiar `createConocimiento` para que reciba un `ConocimientoPayload` y lo mande tal cual con `api.post("/conocimiento", payload)`. Prueba: crear un conocimiento desde el form guarda `titulo` y `nivel` correctos en Mongo, no un documento vacío.
3. En `useConocimientoStore`, añadir `updateConocimiento(id, payload)`: `api.put(`/conocimiento/${id}`, payload)` y `dispatch(setConocimiento(conocimiento.map((con: Conocimiento) => (con.id === data.id ? data : con))))`. Exportarla en el objeto de retorno. Prueba: llamarla a mano desde la consola actualiza la card sin recargar.
4. Convertir `ConocimientoForm` a controlado: `value` + `onChange` en el input de `titulo` y en el `<select>` de `nivel`, opciones generadas desde `Object.values(ConocimientoNivel)`. Sustituir `useActionState` por un `onSubmit` con `e.preventDefault()` y un `isPending` propio (`useState<boolean>`), puesto a `true` antes del `await` y a `false` en el `finally`. Prueba: crear un conocimiento nuevo desde el form funciona igual que antes.
5. Añadir a `ConocimientoForm` la prop `conocimientoEnEdicion` y un `useEffect` con dependencia `[conocimientoEnEdicion]` que rellene el estado `conocimiento` según la tabla de mapeo, o lo devuelva a `CONOCIMIENTO_VACIO` si es `null`. Prueba: pulsar `Editar` en una card rellena título y nivel.
6. Añadir la función `limpiarFormulario()` en `ConocimientoForm`, que devuelve el estado a `CONOCIMIENTO_VACIO` y llama a `props.onLimpiar()`. Renderizar bajo el botón de submit un `<button type="button">Borrar formulario</button>` que la invoque. Prueba: con un conocimiento cargado, pulsarlo deja el form vacío y el título vuelve a `Crear Conocimiento`.
7. En el submit de `ConocimientoForm`, montar el `ConocimientoPayload` desde el estado (con `titulo.trim()`) y llamar a `onAddConocimiento`. Al terminar con éxito, llamar a `limpiarFormulario()`. El texto del botón es `Actualizar Conocimiento` / `Actualizando...` si hay `conocimientoEnEdicion`, y `Agregar Conocimiento` / `Agregando...` si no. Prueba: editar un conocimiento y guardar deja el form vacío y la card actualizada.
8. En `ConocimientoCard`, añadir las props `onEditar` y `enEdicion`, un `<button onClick={() => onEditar(conocimiento)}>Editar</button>` **antes** del de `Delete` dentro de `.actions`, la clase `.actionsFila` junto a `.actions` y la clase `.enEdicion` en el `.Card` cuando `enEdicion` es `true`. Prueba: el botón aparece a la izquierda de `Delete` y la card se resalta.
9. En `Conocimiento.tsx`, añadir `const [conocimientoEnEdicion, setConocimientoEnEdicion] = useState<IConocimiento | null>(null)`, pasar `onEditar={setConocimientoEnEdicion}` y `enEdicion={con.id === conocimientoEnEdicion?.id}` a cada card, y al form `conocimientoEnEdicion`, `onLimpiar={() => setConocimientoEnEdicion(null)}` y un `onAddConocimiento` que llame a `updateConocimiento(conocimientoEnEdicion.id, payload)` si hay conocimiento en edición y a `createConocimiento(payload)` si no. El `h1` muestra `Editar Conocimiento` o `Crear Conocimiento` según el estado. Prueba: el ciclo completo editar → guardar → volver a crear funciona sin recargar la página.
10. Comprobación end to end: editar un conocimiento que esté usado como tecnología en una experiencia, y verificar en `/experiencia` que el chip del `MultiSelect` y la lista de tecnologías de la card muestran el título nuevo sin recargar.

## Criterios de aceptación

- [ ] Cada `ConocimientoCard` muestra un botón `Editar` a la izquierda del botón `Delete`, en la misma fila.
- [ ] Pulsar `Editar` rellena `titulo` y `nivel` con los valores de ese conocimiento.
- [ ] El `<select>` de nivel queda posicionado en el nivel del conocimiento editado, no en la primera opción.
- [ ] Con un conocimiento cargado, el título de la sección dice `Editar Conocimiento`.
- [ ] Con un conocimiento cargado, el botón de submit dice `Actualizar Conocimiento`.
- [ ] La card que se está editando se distingue visualmente de las demás.
- [ ] Pulsar `Editar` en una segunda card sustituye el contenido del formulario por el de esa card y mueve el resaltado.
- [ ] Guardar en modo edición lanza `PUT /api/conocimiento/:id`, no `POST`.
- [ ] Tras guardar en modo edición, la card refleja los cambios sin recargar la página y sin una llamada extra a `GET /conocimiento`.
- [ ] Tras guardar, el formulario queda vacío y en modo creación.
- [ ] Existe un botón `Borrar formulario` debajo del botón de submit.
- [ ] `Borrar formulario` vacía el título y devuelve el nivel a `Básico`.
- [ ] Tras `Borrar formulario`, el título vuelve a `Crear Conocimiento` y el submit a `Agregar Conocimiento`.
- [ ] Tras `Borrar formulario` en modo edición, el siguiente envío crea un conocimiento nuevo (`POST`), no actualiza el anterior.
- [ ] `Borrar formulario` no envía el formulario (es `type="button"`).
- [ ] Crear un conocimiento nuevo sigue funcionando y el `POST` viaja como JSON (`{ titulo, nivel }`), no como `multipart/form-data`.
- [ ] El `nivel` enviado es uno de `Básico`, `Intermedio` o `Avanzado`, y el backend no responde 500 por el `enum`.
- [ ] Editar el título de un conocimiento usado como tecnología actualiza el texto en las cards de `/experiencia` y en el `MultiSelect` sin recargar.
- [ ] `npx tsc --noEmit` no reporta errores nuevos.
- [ ] Las cards de Experiencia, Formación y Formación Complementaria no cambian de aspecto.

## Decisiones

- **Sí:** replicar el patrón completo de la SPEC 03 (form controlado, `Editar`, `Borrar formulario`, resaltado, título y botón contextuales). Las dos páginas quedan con la misma interacción y el usuario no tiene que aprender dos flujos.
- **Sí:** formulario controlado. Con `defaultValue` habría que remontar el form con `key` en cada `Editar` y `Borrar formulario` necesitaría otro cambio de `key` artificial; controlado hace que cargar, limpiar y montar el payload sean la misma operación sobre el estado.
- **Sí:** abandonar `FormData` y `useActionState` también aquí. Además del argumento de la SPEC 03, el `createConocimiento` actual manda el `FormData` crudo a axios, que viaja como `multipart/form-data`, y el backend solo tiene `express.json()`: el `POST` actual no puede estar guardando bien los campos. Pasar a JSON lo arregla de paso.
- **Sí:** alinear `ConocimientoNivel` con el `enum` del modelo (`'Básico' | 'Intermedio' | 'Avanzado'`). Hoy el enum de TypeScript es decorativo, no coincide con lo que se guarda y nadie lo usa; con el form controlado el `<select>` sí lo usa, y un valor en minúsculas haría fallar el `save()` del backend.
- **Sí:** generar las opciones del `<select>` con `Object.values(ConocimientoNivel)`. El enum pasa a ser la única fuente de los tres valores.
- **Sí:** `conocimientoEnEdicion` como `useState` en `Conocimiento.tsx`. Es estado de UI efímero, no compartido con otras rutas; mismo criterio que `experienciaEnEdicion`.
- **Sí:** reemplazar el elemento en el store con la respuesta del `PUT`, en vez de recargar con `getConocimiento()`. Mismo patrón que `deleteConocimiento`, sin request extra ni parpadeo de la lista, y arrastra el título nuevo a `/experiencia` gratis.
- **Sí:** limpiar el formulario automáticamente tras guardar. Deja la interfaz en un estado inequívoco y evita que un segundo submit accidental repita el `PUT`.
- **No:** acción `updateConocimiento` en `conocimientoSlice`. `setConocimiento` con el array recalculado en el hook es lo que ya hacen `create` y `delete`.
- **No:** tocar `Cards.module.scss`. `.actionsFila` y `.enEdicion` se añadieron en la SPEC 03 dentro de `.Card` y son reutilizables tal cual.
- **No:** confirmación al descartar cambios sin guardar, ni scroll automático al formulario. Se dejaron fuera en la SPEC 03 y se mantiene la simetría.
- **No:** migrar documentos con `nivel` fuera del `enum`. Si existieran, el `<select>` los mostraría en la primera opción y el guardado los normalizaría; no se ha detectado ninguno.

## Riesgos

| Riesgo                                                                                              | Mitigación                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cambiar la firma de `createConocimiento` rompe otro consumidor del hook                             | `createConocimiento` solo lo consume `Conocimiento.tsx`; `ExperienciaCard` y `ExperienciaForm` usan el hook solo para `conocimiento` y `getConocimiento`. Se comprueba con una búsqueda antes de tocarlo. |
| El `nivel` viaja en minúsculas y el `PUT`/`POST` responde 500 por el `enum` del modelo              | El paso 1 alinea el enum con los valores del backend y el `<select>` se genera desde él; hay criterio de aceptación explícito sobre los valores enviados.                                            |
| Un conocimiento guardado con un `nivel` antiguo no coincide con ninguna `<option>` y el select queda en `Básico` | El `useEffect` asigna el valor tal cual viene; si no coincide, el usuario ve `Básico` y al guardar se normaliza. Documentado como decisión, no como bug.                                             |
| Guardar en modo edición dispara un `POST` y duplica el conocimiento                                 | `Conocimiento.tsx` decide entre `createConocimiento` y `updateConocimiento` según `conocimientoEnEdicion`, con criterio de aceptación explícito de que se lanza `PUT`.                              |
| Limpiar el formulario sin desvincular el id provoca un `PUT` que vacía el conocimiento editado      | `limpiarFormulario` llama siempre a `onLimpiar()`, que pone `conocimientoEnEdicion` a `null`. Criterio de aceptación específico.                                                                    |
| El backend aún no tiene el `PUT` desplegado y la edición falla con 404 de ruta                      | Esta spec depende de la SPEC 03 del backend; se implementa después. El error se ve en el `console.error` del hook.                                                                                  |
| Quitar `useActionState` pierde el `isPending` que deshabilita el submit                             | Se sustituye por un `useState<boolean>` propio, puesto a `true` antes del `await` y a `false` en el `finally`, igual que en `ExperienciaForm`.                                                      |
| El botón `Borrar formulario` envía el formulario al no llevar `type`                                | `type="button"` explícito, con criterio de aceptación propio.                                                                                                                                       |
