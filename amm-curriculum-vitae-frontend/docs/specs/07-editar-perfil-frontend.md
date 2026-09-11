# SPEC 07 — Editar Perfil desde el formulario

> **Estado:** Aprobada
> **Depende de:** SPEC 06 del backend (`../amm-curriculum-vitae-backend/specs/06-editar-perfil.md`, Borrador), que aporta el `PUT /api/perfil` y mantiene el `POST`
> **Fecha:** 2026-08-31
> **Objetivo:** Convertir `PerfilForm` en un formulario controlado que precargue siempre el perfil guardado (o campos vacíos si aún no existe) y lo envíe con un único handler que llama a `PUT /perfil` si hay `id` y a `POST /perfil` si no lo hay, eliminando `deletePerfil` del store.

## Alcance

**Dentro:**

- `usePerfilStore`: nueva función `updatePerfil(payload)` que hace `PUT /perfil` y despacha `setPerfil(data)`.
- `usePerfilStore`: `createPerfil` **se mantiene**, pero cambia de firma para recibir un `PerfilPayload` en vez de `FormData`, y corrige su dispatch: hoy hace `setPerfil([...perfil, data])` sobre un estado que es un objeto o `null`, cuando debe ser `setPerfil(data)`.
- `usePerfilStore`: nueva función `guardarPerfil(payload)` que decide la llamada — `perfil?.id ? updatePerfil(payload) : createPerfil(payload)` — y es la que consume la página. `createPerfil` y `updatePerfil` se siguen exportando para usarlas por separado más adelante.
- `usePerfilStore`: **eliminar** `deletePerfil` y quitarlo del objeto devuelto. Está roto hoy: llama a un `setFormacion` que no se importa y a una ruta `DELETE /perfil` que no existe en el backend.
- `getPerfil`: tratar el **404** del backend como "todavía no hay perfil" (no es un error): dejar `perfil` en `null` sin registrar `console.error`. El resto de errores se siguen registrando con `console.error`.
- `PerfilForm` pasa a ser un formulario **controlado** (los ocho campos en un `useState`), y deja de usar `FormData` y `useActionState`, siguiendo el patrón de `FormacionComplementariaForm`.
- `PerfilForm` precarga los valores del perfil recibido por props, o `PERFIL_VACIO` si es `null`; `fechaNacimiento` se recorta con `.slice(0, 10)` para el `<input type="date">`, igual que en las SPEC 05 y 06.
- Un único botón de submit, cuyo texto depende de si hay perfil: `Actualizar Perfil` / `Actualizando...` cuando existe, `Crear Perfil` / `Creando...` cuando no. **Sin** botón `Borrar formulario`: con un solo registro no hay nada que desvincular.
- Añadir `required` al input de `descripcion`, que es `required` en el modelo del backend y hoy permite enviarlo vacío y provocar un 500.
- Corregir las props de `PerfilForm`: hoy declara `onAddPerfil: Perfil` (tipo del modelo, no de la función). Pasan a ser `perfil: Perfil | null` y `onSubmitPerfil: (payload: PerfilPayload) => Promise<void> | void`.
- Nuevo tipo `PerfilPayload` en `interfaces/perfil.interface.ts`, derivado de `Perfil` con `Omit<Perfil, 'id'>`, igual que hacen `formacion.interface.ts` y `formacionComplementaria.interface.ts`.
- Corregir el tipo de `Perfil.fechaNacimiento`: pasa de `Date` a `string`, porque la API la devuelve serializada en ISO 8601 (`"1985-04-17T00:00:00.000Z"`) y el formulario la maneja como texto.
- Hacer `Perfil.foto` opcional (`foto?: string`): el backend omite la propiedad cuando el documento no la tiene. En el payload viaja siempre como `string` (`""` cuando no hay foto), que el backend normaliza a `$unset`.
- `pages/Perfil.tsx`: el título pasa de `Crear Perfil` a `Editar Perfil`, se deja de desestructurar `createPerfil`/`deletePerfil` (y desaparece el `//TODO`), y se pasan `perfil` y `guardarPerfil` al formulario.

**Fuera de alcance (para futuras specs):**

- `PerfilCard` de solo lectura: el formulario ya muestra los datos guardados y la vista pública `/curriculum` ya pinta el perfil.
- Borrar el perfil desde la interfaz: el backend no expone `DELETE` (SPEC 06 del backend).
- Impedir desde el frontend que se cree un segundo perfil más allá de la comprobación de `perfil?.id`.
- Cambiar `MainPage` o `curriculum.interface.ts` (`perfil: any`), que se seguirán tipando como hasta ahora.
- Subida de ficheros para la foto: `foto` sigue siendo un `<input type="text">` con la URL.
- Previsualizar la foto en el formulario.
- Mostrar errores del backend en la interfaz: se siguen registrando con `console.error`.
- Mensaje de confirmación tras guardar (toast, banner).
- Validación en cliente más allá de los `required` de los inputs (formato de email, teléfono, longitud de la descripción).
- Confirmación antes de descartar cambios sin guardar y aviso al salir de la página.
- Estado de edición en Redux: el formulario mantiene su estado local.
- Cambios en `Form.module.scss` y `Layout.module.scss`.
- Refactor de `perfilSlice` (`setLoadingPerfil` y `setErrorPerfil` siguen sin usarse, como hoy).

## Modelo de datos

No hay persistencia nueva en el frontend. En `interfaces/perfil.interface.ts` se ajustan dos campos y se declara el payload reutilizando la interfaz existente:

```ts
export interface Perfil {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  fechaNacimiento: string;
  descripcion: string;
  foto?: string;
}

export interface PerfilPayload extends Omit<Perfil, 'id'> {
  foto: string;
}
```

- `fechaNacimiento` se tipa `string` porque la API la devuelve en ISO 8601; el `<input type="date">` necesita `"YYYY-MM-DD"`, que se obtiene con `.slice(0, 10)`.
- `foto` es opcional en `Perfil` (el backend omite la propiedad si el documento no la tiene) y obligatoria en `PerfilPayload`: viaja siempre, con `""` cuando no hay foto, y el backend hace `$unset`.
- `PerfilState`, `PerfilAction` y `PerfilDispatch` no cambian.

Estado local de `PerfilForm`:

```ts
const PERFIL_VACIO: PerfilPayload = {
  nombre: '',
  apellidos: '',
  email: '',
  telefono: '',
  direccion: '',
  fechaNacimiento: '',
  descripcion: '',
  foto: '',
};

const [datosPerfil, setDatosPerfil] = useState<PerfilPayload>(PERFIL_VACIO);
const [isPending, setIsPending] = useState<boolean>(false);
```

Props de `PerfilForm`:

```ts
interface Props {
  perfil: Perfil | null;
  onSubmitPerfil: (payload: PerfilPayload) => Promise<void> | void;
}
```

El formulario **no** decide el verbo: manda siempre el payload y `guardarPerfil` elige entre `POST` y `PUT` según `perfil?.id`.

## Plan de implementación

1. En `interfaces/perfil.interface.ts`, cambiar `fechaNacimiento` a `string`, hacer `foto` opcional y añadir `PerfilPayload`. Prueba: `npm run build` compila; los errores de tipo que aparezcan son solo los de `PerfilForm`, que se arreglan en el paso 5.
2. En `usePerfilStore`, cambiar `createPerfil` para que reciba un `PerfilPayload`, lo mande con `api.post('/perfil', payload)` y despache `setPerfil(data)` en vez de `setPerfil([...perfil, data])`. Prueba: con la base de datos vacía, guardar el formulario crea el perfil y el store queda con el objeto devuelto, no con un array.
3. En `usePerfilStore`, añadir `updatePerfil(payload: PerfilPayload)`: `api.put('/perfil', payload)` y `dispatch(setPerfil(data))`, con `try/catch` y `console.error('Error updating perfil:', error)`. Añadir `guardarPerfil(payload)` que devuelva `perfil?.id ? updatePerfil(payload) : createPerfil(payload)`. Eliminar `deletePerfil` y actualizar el objeto devuelto. Prueba: el proyecto compila y ninguna referencia a `setFormacion` queda en el fichero.
4. En `getPerfil`, tratar el 404 aparte: si `error?.response?.status === 404`, no registrar nada y dejar `perfil` en `null`; en cualquier otro caso, `console.error` como hasta ahora. Prueba: con la colección vacía, la consola no muestra errores y la página pinta el formulario vacío.
5. Reescribir `PerfilForm` como formulario controlado: `PERFIL_VACIO`, `useState`, `useEffect` que precarga desde la prop `perfil` (con `fechaNacimiento: perfil.fechaNacimiento.slice(0, 10)` y `foto: perfil.foto ?? ''`) o restablece `PERFIL_VACIO` si es `null`, `value`/`onChange` en los ocho inputs y `onSubmit` con `e.preventDefault()`. Prueba: al recargar `/perfil` con un perfil guardado, los ocho campos aparecen rellenos con sus valores.
6. En ese mismo `onSubmit`, recortar con `trim()` los campos de texto, llamar a `await onSubmitPerfil(payload)` entre `setIsPending(true)` y `finally { setIsPending(false) }`, y **no** limpiar el formulario al terminar. Prueba: al guardar, el botón muestra el texto de "en curso" y al volver la respuesta los campos siguen mostrando los valores enviados.
7. Añadir `required` al input de `descripcion` y dejar el botón único dentro de `div.actions`, con el texto condicionado a `perfil` (`Crear Perfil` / `Actualizar Perfil`). Prueba: enviar con la descripción vacía lo impide el navegador y no se dispara ninguna petición.
8. En `pages/Perfil.tsx`, cambiar el `h1` a `Editar Perfil`, desestructurar solo `perfil`, `loading`, `error`, `getPerfil` y `guardarPerfil`, y renderizar `<PerfilForm perfil={perfil} onSubmitPerfil={guardarPerfil} />`. Prueba: la página compila sin el `//TODO` y sin referencias a `createPerfil`/`deletePerfil`.
9. Comprobación end to end con el backend de la SPEC 06: con la base de datos vacía, `/perfil` muestra el formulario vacío y el botón `Crear Perfil` → rellenar y enviar → la petición es `POST /api/perfil` y responde 201 → el botón pasa a `Actualizar Perfil` y los campos siguen rellenos → cambiar un campo y volver a guardar → `PUT /api/perfil` responde 200 → vaciar `foto` y guardar → la foto desaparece → `/curriculum` muestra los datos nuevos en `MainPage`.

## Criterios de aceptación

- [ ] Con un perfil guardado, al entrar en `/perfil` los ocho campos aparecen precargados con sus valores.
- [ ] `fechaNacimiento` se muestra correctamente en el `<input type="date">` (fecha del perfil, no vacío).
- [ ] Sin perfil en la base de datos, la página muestra el formulario con todos los campos vacíos y sin mensaje de error.
- [ ] El 404 de `GET /api/perfil` no deja rastro de `console.error` en la consola.
- [ ] Sin perfil guardado, enviar el formulario dispara `POST /api/perfil` y ninguna otra petición.
- [ ] Con un perfil guardado, enviar el formulario dispara `PUT /api/perfil` y ninguna otra petición.
- [ ] Nunca se lanza una petición `DELETE /perfil`.
- [ ] Tras el `POST`, el store guarda el objeto devuelto (no un array) y el botón pasa a decir `Actualizar Perfil` sin recargar la página.
- [ ] Con un perfil existente, el envío lo actualiza y el store refleja los valores nuevos sin recargar la página.
- [ ] Tras guardar, el formulario **no** se vacía: sigue mostrando los datos enviados.
- [ ] Mientras la petición está en curso el botón se deshabilita y muestra `Creando...` o `Actualizando...` según el caso.
- [ ] No existe ningún botón `Borrar formulario`.
- [ ] El título de la página es `Editar Perfil`.
- [ ] Intentar enviar con `descripcion` vacía lo bloquea el navegador y no se lanza ninguna petición.
- [ ] Vaciar el campo `foto` y guardar elimina la foto: al recargar, el campo aparece vacío.
- [ ] `usePerfilStore` ya no exporta `deletePerfil` y no queda ninguna referencia a `setFormacion` en el fichero.
- [ ] `npm run build` compila sin errores de TypeScript y `npm run lint` no añade avisos nuevos.
- [ ] Las páginas de `Formacion`, `FormacionComplementaria`, `Conocimiento` y `Experiencia` siguen funcionando igual.
- [ ] `MainPage` (`/curriculum`) sigue pintando el perfil, con los valores actualizados.

## Decisiones

- **Sí:** la decisión de crear o actualizar vive en el frontend (`perfil?.id ? PUT : POST`). El backend mantiene los dos verbos con su semántica estándar en vez de un upsert, y el `POST` sigue disponible para usos futuros.
- **Sí:** encapsular esa decisión en `guardarPerfil` dentro del hook, no en el componente. El formulario solo conoce el payload, y `createPerfil`/`updatePerfil` siguen exportadas por si más adelante hay que llamarlas por separado.
- **Sí:** eliminar `deletePerfil` en vez de arreglarlo. Está roto (usa un `setFormacion` no importado) y apunta a una ruta que no existe; con un único perfil, borrarlo no tiene caso de uso.
- **Sí:** corregir el dispatch de `createPerfil` a `setPerfil(data)`. El estado del slice es `Perfil | null`, no un array: el `[...perfil, data]` actual reventaría con `perfil` en `null`.
- **Sí:** formulario controlado con `useState`, como `FormacionComplementariaForm` y `FormacionForm`. Es la única forma de precargar los valores guardados, que es el objetivo de la spec.
- **No:** botón `Borrar formulario`. En las SPEC 05 y 06 sirve para desvincular el registro en edición; aquí solo hay uno y vaciar los campos no permitiría guardarlos (todos son `required` menos `foto`).
- **Sí:** no limpiar el formulario tras guardar, al contrario que en las SPEC 05 y 06. El perfil sigue siendo el registro en edición.
- **Sí:** tratar el 404 del `GET` en el hook en lugar de cambiar el contrato del backend. La respuesta ya existe y también la consume `/api/curriculum`.
- **Sí:** un solo estado `datosPerfil` con los ocho campos, en vez de ocho `useState`. Coincide con el patrón de los formularios ya migrados.
- **Sí:** retipar `fechaNacimiento` a `string`. El tipo `Date` actual es falso: axios entrega el JSON sin deserializar fechas, así que `perfil.fechaNacimiento.slice()` es lo que realmente funciona.
- **Sí:** añadir `required` al input de `descripcion` en lugar de quitar el `required` del modelo. La descripción se pinta en la vista pública `MainPage`.
- **No:** tipar `curriculum.interface.ts` (`perfil: any`) en esta spec. Es un `//TODO` anterior, ajeno a la edición del perfil.
- **No:** mostrar errores del backend en la interfaz. Ninguna otra página lo hace; se mantiene la coherencia y se deja para una spec transversal.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Si el `POST` falla, `perfil` sigue en `null` y el siguiente envío vuelve a intentar un `POST`, que puede chocar con el `unique` de `email` si el perfil sí llegó a crearse | Aceptado: el 500 se registra en consola y basta recargar la página para que el `GET` traiga el perfil y el formulario pase a `PUT` |
| Doble clic en el botón con la base de datos vacía dispara dos `POST` y crea dos perfiles | El botón se deshabilita con `isPending` mientras la petición está en curso |
| Cambiar `fechaNacimiento` a `string` rompe otro consumidor de la interfaz `Perfil` | Solo la consumen `PerfilForm` y el slice; `MainPage` lee del `curriculum`, tipado como `any`, y no usa la fecha |
| El `PUT` o el `POST` fallan (500 por un `required` o por el `unique` de `email`) y el usuario no ve nada | Aceptado y explícito: se registra con `console.error`, igual que en el resto de páginas; el formulario conserva lo tecleado porque no se limpia |
| Implementar esta spec sin la 06 del backend deja el `PUT` sin endpoint | La dependencia está declarada en la cabecera; se implementa primero el backend |
| Un perfil guardado antes de esta spec sin `foto` hace que la precarga escriba `undefined` en un input controlado y React avise | Se precarga con `perfil.foto ?? ''`, con criterio de aceptación propio |
| El `useEffect` de precarga pisa lo que el usuario está escribiendo al llegar la respuesta | Es lo buscado: tras guardar, el formulario debe reflejar lo que devuelve el backend (valores ya recortados por el `trim` del modelo) |
