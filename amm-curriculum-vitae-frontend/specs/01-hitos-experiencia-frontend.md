# SPEC 01 — Hitos de Experiencia en el frontend

> **Estado:** Implementada
> **Depende de:** SPEC 01 del backend (`../amm-curriculum-vitae-backend/specs/01-hitos-experiencia.md`, Implementada)
> **Fecha:** 2026-08-28
> **Objetivo:** Permitir introducir N hitos al crear una experiencia desde `ExperienciaForm` y mostrarlos en `ExperienciaCard`, enviando el POST como JSON en lugar de `FormData`.

## Alcance

**Dentro:**

- Interface `Hito` y campo `hitos: Hito[]` en `src/interfaces/experiencia.interface.ts`.
- Inputs dinámicos de hitos en `src/pages/forms/ExperienciaForm.tsx`: añadir fila, borrar fila, N hitos.
- Render de los hitos como lista en `src/pages/cards/ExperienciaCard.tsx`.
- `createExperiencia` de `src/hooks/useExperienciaStore.ts` pasa a enviar `application/json` con `tecnologias` y `hitos` como arrays.
- Estilos mínimos para las filas de hitos en `Form.module.scss` y para la lista en `Cards.module.scss`.

**Fuera de alcance (para futuras specs):**

- Render de hitos en `src/Curriculum.tsx` y en el PDF exportado (`helpers/exportToPDF.ts`).
- Pasar a JSON los demás stores (`useConocimientoStore`, `useFormacionStore`, `useFormacionComplementariaStore`, `usePerfilStore`). Siguen con `FormData`.
- Edición de hitos de una experiencia ya creada (no existe `PUT /api/experiencia/:id`).
- Ordenación manual de hitos, drag & drop.
- Validación de longitud máxima del texto de un hito.
- Los ficheros `src/actions/Experiencia/createExperiencia.action.ts` (no se usa desde la página) quedan como están.

## Modelo de datos

`src/interfaces/experiencia.interface.ts`:

```ts
export interface Hito {
  id: string;
  descripcion: string;
  experiencia: string;
}

export interface Experiencia {
  id: string;
  empresa: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin?: string;
  tecnologias: string[];
  hitos: Hito[];
}
```

`hitos` no es opcional: el backend devuelve siempre el array (vacío si no hay). Aun así el render se defiende con `experiencia.hitos?.length`.

Estado local del form, en `ExperienciaForm`:

```ts
const [hitos, setHitos] = useState<string[]>([""]);
```

Un string por fila. Arranca con una fila vacía. Cada fila es un `<input name="hitos" value={...} />` controlado, así el `FormData` del `useActionState` recoge un valor por fila.

Cuerpo del `POST /api/experiencia` (JSON):

```json
{
  "empresa": "ACME",
  "descripcion": "Backend developer",
  "fechaInicio": "2020-01-01",
  "fechaFin": "",
  "tecnologias": ["664...", "665..."],
  "hitos": ["Migré el monolito a servicios", "Reduje el build de 8 a 2 min"]
}
```

El controlador `crearExperiencia` ya normaliza ambos campos con `[].concat(...)`, así que acepta arrays sin cambios en el backend.

## Plan de implementación

1. Añadir `Hito` y el campo `hitos` a `src/interfaces/experiencia.interface.ts`. Prueba: `npx tsc --noEmit` no da errores nuevos.
2. En `useExperienciaStore.createExperiencia`, construir el objeto JSON a partir del `FormData` (`Object.fromEntries` para los campos simples, `formData.getAll("tecnologias")` y `formData.getAll("hitos")` para los arrays), filtrar los hitos vacíos con `trim()` y hacer `api.post("/experiencia", payload)` sin cabecera multipart. Prueba: crear una experiencia sin hitos sigue funcionando igual que antes y la respuesta trae `hitos: []`.
3. En `ExperienciaForm`, añadir el estado `hitos`, el bloque de inputs dinámicos con botón `+ Añadir hito` por lista y botón de borrar por fila, y quitar `encType="multipart/form-data"` del `<form>`. Los botones llevan `type="button"` para no enviar el form. Prueba: añadir tres filas, borrar la del medio, y ver en el `console.log` del hook que el payload lleva dos hitos.
4. En `ExperienciaCard`, renderizar bajo el párrafo de tecnologías un bloque `Hitos:` con `<ul><li>` por hito, oculto si `hitos` está vacío o no viene. Prueba: una experiencia con hitos los lista; una sin hitos no muestra el bloque ni un `Hitos:` huérfano.
5. Añadir en `Form.module.scss` las clases de la lista de hitos (fila en `flex-direction: row`, botones con ancho propio que sobrescriba el `button { width: 100px }` de `.Form`) y en `Cards.module.scss` la clase de la `<ul>` (sin margen superior, `padding-left` para las viñetas). Prueba: visual, el form no se descuadra.
6. Comprobación end to end: crear una experiencia con dos hitos, ver que aparecen en su card sin recargar (el `dispatch(setExperiencia([...experiencia, data]))` ya usa la respuesta poblada del backend), recargar la página y ver que siguen ahí.

## Criterios de aceptación

- [ ] El form muestra al menos una fila de hito vacía al cargar.
- [ ] `+ Añadir hito` añade una fila y no envía el formulario.
- [ ] El botón de borrar de una fila elimina esa fila concreta y no las demás.
- [ ] Enviar el form con dos hitos rellenos hace un `POST /api/experiencia` con `Content-Type: application/json` y `hitos` como array de dos strings.
- [ ] Una fila de hito vacía o con solo espacios no llega en el payload.
- [ ] Un hito con comas en el texto llega como un único elemento del array, con el texto íntegro.
- [ ] Enviar el form sin ningún hito crea la experiencia igual que antes de esta spec.
- [ ] `tecnologias` sigue llegando correctamente al backend tras el cambio a JSON (la experiencia creada muestra sus tecnologías en la card).
- [ ] `ExperienciaCard` lista los hitos de la experiencia bajo las tecnologías.
- [ ] Una experiencia sin hitos no muestra el bloque `Hitos:`.
- [ ] La experiencia recién creada aparece en el listado con sus hitos sin recargar la página.
- [ ] `npx tsc --noEmit` no reporta errores nuevos.

## Decisiones

- **Sí:** inputs dinámicos con añadir/borrar. Es la UX que encaja con un campo repetido de N valores y con el contrato del backend.
- **No:** textarea con un hito por línea. Menos código, pero peor edición y obliga a partir por `\n` (y a decidir qué pasa con las líneas en blanco).
- **No:** número fijo de inputs. Limita artificialmente la cantidad de hitos.
- **Sí:** lista `<ul>` en la card. Los hitos son texto largo; unirlos por comas como `tecnologias` sería ilegible.
- **Sí:** pasar `POST /api/experiencia` a JSON. Resuelve la nota pendiente de la SPEC 01 del backend (el body llegaba como multipart a un `express.json()`) y evita depender del parseo de multipart para un caso sin ficheros.
- **No:** pasar a JSON el resto de stores. Está fuera del objetivo de esta spec; se hará cuando toque cada entidad.
- **Sí:** el form sigue entregando `FormData` al callback y la conversión a JSON vive en el hook. Mantiene `useActionState` y no cambia la firma de `onAddExperiencia` ni `Experiencia.tsx`.
- **No:** nueva interface `CrearExperienciaPayload` con el form construyendo el objeto. Cambia más superficie para el mismo resultado.
- **Sí:** filtrar los hitos vacíos en el frontend, aunque el backend ya lo haga. Evita enviar ruido y hace el payload legible al depurar.
- **Sí:** hitos como `string[]` en el estado del form (no objetos con id). Al crear todavía no existen ids.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El cambio a JSON rompe el envío de `tecnologias`, que hoy se manda como cadena unida por comas | El controlador ya normaliza con `[].concat(...).flatMap(split(","))`, que acepta array. Criterio de aceptación específico para verificarlo. |
| Los botones de añadir/borrar heredan `button { width: 100px }` de `.Form` y descuadran las filas | Clases propias en `Form.module.scss` con ancho explícito (paso 5). |
| Un `<button>` sin `type` dentro del form envía el formulario al pulsarlo | Todos los botones de la lista llevan `type="button"` (paso 3). |
| Experiencias antiguas guardadas antes de la SPEC 01 del backend podrían no traer `hitos` | El render usa `hitos?.length` y no asume el array. |
| Usar el índice del array como `key` de las filas al borrar del medio puede confundir a React | Filas controladas por valor y `key` por índice es aceptable aquí; si aparece comportamiento raro al borrar, pasar el estado a `{ id: crypto.randomUUID(), texto }`. |
