# SPEC 09 — Pestañas de contenido y bloque de contacto en la página principal

> **Estado:** Implementada
> **Depende de:** SPEC 07 del frontend (`07-editar-perfil-frontend.md`, Aprobada), que fija la interfaz `Perfil` con `foto?: string` y los campos de contacto
> **Fecha:** 2026-09-01
> **Objetivo:** Convertir `MainPage` en el currículum completo: cuatro pestañas (Experiencia, Formación Académica, Formación Complementaria, Conocimientos) que pintan los listados que ya devuelve `GET /api/curriculum`, y mover dirección, teléfono y email a una columna con iconos entre la foto y el botón `Export to PDF`.

## Alcance

**Dentro:**

- Nuevo componente `Tabs` (`src/components/Tabs.tsx` + `Tabs.module.scss`): recibe las pestañas y mantiene en `useState` la activa. La URL no cambia, el router no se toca. El panel de contenido tiene scroll propio ajustado a la ventana (`max-height: calc(100vh - 220px)` y `overflow-y: auto`); la fila de botones lleva `flex-shrink: 0` y queda siempre visible.
- Nuevas tarjetas de **solo lectura** en `src/pages/curriculum/`: `ExperienciaItem`, `FormacionItem`, `FormacionComplementariaItem`, `ConocimientoItem`, con `Curriculum.module.scss` propio y un `index.ts` de barril. **No** tienen botones `Editar` / `Eliminar`.
- `MainPage.tsx` renderiza `<Tabs>` dentro del bloque `styles.information` (la columna derecha, a la derecha de la foto), justo debajo de la descripción del perfil, con `Experiencia` activa por defecto y el orden: Experiencia | Formación Académica | Formación Complementaria | Conocimientos. El bloque `styles.information` pasa a renderizarse siempre; el condicional `{perfil && ...}` envuelve solo nombre y descripción, para que las pestañas sigan apareciendo sin perfil.
- Ordenación en el frontend: `experiencia` por `fechaInicio` descendente, `formaciones` y `formacionesComplementarias` por `fechaFin` descendente, `conocimiento` en el orden que llega del backend.
- Mensaje de lista vacía por pestaña (`Sin experiencia registrada`, etc.). No se pinta indicador de carga.
- Los campos `direccion`, `telefono` y `email` salen del bloque `styles.information` (que conserva **solo** `nombre + apellidos` y `descripcion`) y pasan a un nuevo bloque `styles.contacto` dentro de `styles.column`, entre la `<img>` de la foto y el `Button` de `Export to PDF`. Orden: chincheta (dirección), teléfono, email.
- Tres iconos SVG nuevos en `public/icons/`: `chincheta.svg`, `telefono.svg`, `sobre.svg`, monocromos y con `fill="currentColor"`.
- `src/helpers/getIcons.ts`: se corrige la ruta (`/public/icons/...` → `/icons/...`), se tipa el parámetro y se añaden los casos `chincheta` y `telefono` además de `sobre`.
- La foto pasa a usar `perfil.foto` con respaldo en la actual: `src={perfil?.foto || '/references/foto.jpg'}`.
- Tipado del currículum: nueva interfaz `Curriculum` y corrección de `CurriculumState` en `src/interfaces/curriculum.interface.ts`, que hoy declara los listados en la raíz mientras el slice escribe en `state.curriculum`, y tipa `perfil` como `any`.
- Se elimina el `console.log('Curriculum in MainPage:', curriculum)` de `MainPage` y el `console.log('Curriculum data:', data)` de `useCurriculumStore`.
- Se marca `[x] Ventana principal Curriculum` en `references/TODO.md`.

**Fuera de alcance (para futuras specs):**

- La exportación a PDF: `exportToPDF` sigue recibiendo el mismo `ref` y por tanto exportará **solo la pestaña activa**. Limitación conocida y aceptada; incluir las cuatro secciones en el PDF es otra spec.
- Enlazar una pestaña concreta por URL (`/#experiencia`, rutas hijas) y recordar la pestaña activa entre recargas.
- Las páginas de administración (`/experiencia`, `/formacion`, `/formacion-complementaria`, `/conocimiento`, `/perfil`), sus formularios y sus cards: no se tocan.
- El componente `MensajeAccion` de la SPEC 08: la vista pública no muestra mensajes.
- Cabecera de navegación entre `/` y las páginas de administración.
- Convertir dirección, teléfono y email en enlaces `mailto:` / `tel:` / mapa.
- Responsive y diseño móvil del currículum; el maquetado actual sigue siendo de escritorio.
- Animaciones o transiciones al cambiar de pestaña.
- Agrupar o filtrar conocimientos por `nivel`.
- Usar `loading` y `error` del store de currículum en la interfaz (siguen sin consumirse, como en el resto del proyecto).
- Sustituir el `<img>` de los iconos por sprites SVG, `<use>` o una librería de iconos.
- Subida de la foto al servidor: `perfil.foto` sigue siendo una URL escrita a mano.
- Tests automatizados: el proyecto no tiene suite hoy.

## Modelo de datos

No hay persistencia nueva ni cambios en el backend: `GET /api/curriculum` ya devuelve `{ conocimiento, experiencia, formaciones, formacionesComplementarias, perfil }`.

`src/interfaces/curriculum.interface.ts` pasa a:

```ts
export interface Curriculum {
  conocimiento: Conocimiento[];
  experiencia: Experiencia[];
  formaciones: Formacion[];
  formacionesComplementarias: FormacionComplementaria[];
  perfil: Perfil | null;
}

export interface CurriculumState {
  curriculum: Curriculum | null;
  loading: boolean;
  error: string | null;
}
```

Nótese que las claves son **`formaciones`** y **`formacionesComplementarias`** (plural), como las devuelve el controlador `curriculum.js` del backend, no `formacion` / `formacionComplementaria` como declara la interfaz actual.

`CurriculumAction` y `CurriculumDispatch` no cambian. El `initialState` del slice (`src/store/curriculum/slice.ts`) pasa a `{ curriculum: null, loading: false, error: null }`, que es lo que sus reducers ya asumen.

Props de `Tabs`:

```ts
interface Tab {
  id: string;
  titulo: string;
  contenido: ReactNode;
}

interface Props {
  tabs: Tab[];
}
```

`Tabs` guarda `const [activa, setActiva] = useState<string>(tabs[0]?.id ?? '')` y renderiza la lista de botones más el `contenido` de la pestaña activa.

Pestañas de `MainPage`:

| `id`                        | Título                    | Origen                                    | Orden                  | Vacío                                   |
| --------------------------- | ------------------------- | ----------------------------------------- | ---------------------- | --------------------------------------- |
| `experiencia`               | Experiencia               | `curriculum.experiencia`                  | `fechaInicio` desc     | `Sin experiencia registrada`            |
| `formacion`                 | Formación Académica       | `curriculum.formaciones`                  | `fechaFin` desc        | `Sin formación académica registrada`    |
| `formacion-complementaria`  | Formación Complementaria  | `curriculum.formacionesComplementarias`   | `fechaFin` desc        | `Sin formación complementaria registrada` |
| `conocimientos`             | Conocimientos             | `curriculum.conocimiento`                 | el del backend         | `Sin conocimientos registrados`         |

Props de las tarjetas de solo lectura:

```ts
// ExperienciaItem
{ experiencia: Experiencia; conocimiento: Conocimiento[] }
// FormacionItem
{ formacion: Formacion }
// FormacionComplementariaItem
{ formacionComplementaria: FormacionComplementaria }
// ConocimientoItem
{ conocimiento: Conocimiento }
```

`ExperienciaItem` recibe la lista de conocimientos por props (la del propio currículum) para resolver los `ids` de `tecnologias`; **no** llama a `useConocimientoStore`, al revés que `ExperienciaCard`, para no lanzar una petición extra desde la vista pública.

Contenido de cada tarjeta:

- **ExperienciaItem:** `empresa`, `fechaInicio` – `fechaFin` (o `En la actualidad` si no hay `fechaFin`), `descripcion`, lista de `tecnologias` resueltas a `titulo`, lista de `hitos` (`descripcion`). Las dos listas solo se pintan si tienen elementos.
- **FormacionItem:** `titulo`, `institucion`, `fechaFin`, y `descripcion` solo si existe.
- **FormacionComplementariaItem:** `titulo`, `institucion`, y `fechaFin` solo si existe.
- **ConocimientoItem:** `titulo` y `nivel`.

Las fechas se formatean con el `dateConverter` existente: `dateConverter(new Date(fecha))`.

`src/helpers/getIcons.ts` queda:

```ts
export type IconName = 'sobre' | 'chincheta' | 'telefono';

export const getIcons = (iconName: IconName) => `/icons/${iconName}.svg`;
```

Bloque de contacto, dentro de `styles.column` de `MainPage`:

```
[ foto ]

📍  {perfil.direccion}
📞  {perfil.telefono}
✉   {perfil.email}

[ Export to PDF ]
```

Cada fila es `<div className={styles.contacto__linea}>` con `<img src={getIcons('chincheta')} alt="" width={18} />` y el valor. El `alt` va vacío por ser decorativo: el dato ya se lee como texto.

## Plan de implementación

1. Crear `public/icons/chincheta.svg`, `public/icons/telefono.svg` y `public/icons/sobre.svg`: SVG de trazo simple, `viewBox="0 0 24 24"` y `fill="currentColor"`. Prueba: con `npm run dev`, abrir `http://localhost:5173/icons/sobre.svg` y ver el icono.
2. Reescribir `src/helpers/getIcons.ts` con el tipo `IconName` y la ruta `/icons/<nombre>.svg`. Prueba: `npx tsc --noEmit` sin errores; `getIcons('sobre')` devuelve `/icons/sobre.svg`.
3. Corregir `src/interfaces/curriculum.interface.ts` con `Curriculum` y `CurriculumState` según el modelo de datos, importando `Perfil`. Prueba: `npx tsc --noEmit`; los únicos errores nuevos están en `slice.ts`, `useCurriculumStore.ts` y `MainPage.tsx`, que se resuelven en los pasos 4 y 5.
4. Ajustar el `initialState` de `src/store/curriculum/slice.ts` a `{ curriculum: null, loading: false, error: null }` y quitar el `console.log` de `useCurriculumStore`. Prueba: `npx tsc --noEmit` limpio en ambos ficheros y `/` sigue pintando el perfil.
5. En `MainPage.tsx`, mover `direccion`, `telefono` y `email` al nuevo bloque `styles.contacto` dentro de `styles.column`, entre la `<img>` y el `Button`; dejar en `styles.information` solo nombre y descripción; usar `perfil?.foto || '/references/foto.jpg'` en la foto; borrar el `console.log`. Prueba: en `/` los tres datos aparecen bajo la foto con su icono y encima del botón `Export to PDF`.
6. Añadir a `MainPage.module.scss` las reglas de `.contacto` (columna, `gap`, iconos alineados con el texto) y quitar las de `.info` si dejan de usarse. Prueba: los iconos quedan a la izquierda del texto, alineados verticalmente y a la misma altura de línea.
7. Crear `src/components/Tabs.module.scss` y `src/components/Tabs.tsx` con las props del modelo de datos: una fila de botones (el activo con clase `styles.activa`, `flex-shrink: 0`) y debajo `<div className={styles.panel}>` con el contenido de la pestaña activa y scroll propio (`max-height: calc(100vh - 220px)`, `overflow-y: auto`, scrollbar fina). Prueba: montarlo en `MainPage` con dos pestañas de texto fijo y comprobar que el clic alterna el contenido y que una lista larga rueda dentro del panel sin mover la página.
8. Crear `src/pages/curriculum/Curriculum.module.scss` y los cuatro componentes de solo lectura con el contenido de la tabla, más `src/pages/curriculum/index.ts`. Prueba: `npx tsc --noEmit` limpio y cada componente renderiza con datos de ejemplo.
9. En `MainPage.tsx`, construir el array de pestañas con los cuatro listados, aplicando la ordenación sobre **copias** (`[...lista].sort(...)`, nunca sobre el array de Redux) y el mensaje de vacío cuando `length === 0`, y renderizar `<Tabs tabs={tabs} />` dentro del `div` exportable, en la columna `styles.information`, debajo de la descripción del perfil. `.information` recibe `flex: 1` y `min-width: 0` para ocupar el ancho restante junto a la foto. Prueba: con el backend arriba, las cuatro pestañas muestran sus registros a la derecha de la foto y `Experiencia` está activa al cargar.
10. Marcar `[x] Ventana principal Curriculum` en `references/TODO.md`. Prueba: el fichero refleja la tarea completada.
11. Revisión final: `npm run build` sin errores, `npm run lint` sin avisos nuevos, y las cinco páginas de administración funcionando igual que antes.

## Criterios de aceptación

- [ ] En `/` aparecen cuatro pestañas con los títulos exactos `Experiencia`, `Formación Académica`, `Formación Complementaria` y `Conocimientos`, en ese orden.
- [ ] Al cargar la página, `Experiencia` está activa y su listado visible.
- [ ] Al pulsar cada pestaña se muestra el listado correspondiente y solo ese.
- [ ] La pestaña activa se distingue visualmente de las demás.
- [ ] Una pestaña con muchos registros rueda dentro de su propio panel: la fila de botones sigue visible y la página no crece.
- [ ] Los registros de cada pestaña coinciden en número y contenido con lo que devuelve `GET /api/curriculum`.
- [ ] Las experiencias salen de más reciente a más antigua por `fechaInicio`; las dos formaciones, por `fechaFin`.
- [ ] Una experiencia sin `fechaFin` muestra `En la actualidad`.
- [ ] Una experiencia con tecnologías las muestra por su `titulo`, no por su `id`.
- [ ] Una experiencia sin tecnologías o sin hitos no pinta el bloque vacío correspondiente.
- [ ] Una pestaña sin registros muestra su mensaje de vacío y no una lista vacía.
- [ ] Ninguna tarjeta de la vista pública tiene botones `Editar` ni `Eliminar`.
- [ ] Cargar `/` dispara **una sola** petición, `GET /api/curriculum`; en particular no se pide `/conocimiento`.
- [ ] El nombre completo y la descripción del perfil siguen a la derecha de la foto, y las pestañas aparecen bajo la descripción, en esa misma columna.
- [ ] Dirección, teléfono y email ya **no** están en ese bloque: aparecen bajo la foto, cada uno con su icono a la izquierda, y por encima del botón `Export to PDF`.
- [ ] El orden del bloque de contacto es dirección, teléfono, email.
- [ ] Los tres iconos se cargan desde `/icons/chincheta.svg`, `/icons/telefono.svg` y `/icons/sobre.svg` sin ningún 404 en la pestaña de red.
- [ ] `getIcons` no devuelve ninguna ruta que empiece por `/public/`.
- [ ] Con un perfil que tiene `foto`, se muestra esa imagen; sin `foto`, se sigue mostrando `/references/foto.jpg`.
- [ ] Sin perfil en la base de datos, la página carga sin errores en consola y sin bloque de contacto.
- [ ] La consola no muestra ningún `console.log` de currículum.
- [ ] `npm run build` compila sin errores de TypeScript y `npm run lint` no añade avisos nuevos.
- [ ] `/experiencia`, `/formacion`, `/formacion-complementaria`, `/conocimiento` y `/perfil` siguen funcionando exactamente igual, con sus cards y sus mensajes de la SPEC 08.

## Decisiones tomadas y descartadas

- **Pestañas con estado local en un componente `Tabs`**, no rutas anidadas. La URL de la vista pública sigue siendo `/`, el router no se toca y el bloque exportable a PDF no se parte en varias rutas. Se pierde poder enlazar una pestaña concreta, que se deja documentado como fuera de alcance.
- **Las pestañas van en la columna derecha, bajo la descripción**, no a ancho completo bajo el bloque de información básica. Decidido durante la implementación: el currículum se lee como una sola columna de contenido junto a la tarjeta de foto y contacto, y la columna izquierda no queda con un hueco vacío bajo el botón. Obliga a que `styles.information` se renderice siempre, aunque no haya perfil.
- **Componentes de solo lectura nuevos** en vez de reutilizar las cards de administración haciendo opcionales las props de acción. Las cards existen para editar y borrar; mezclarlas con la vista pública obligaría a condicionales en cuatro componentes y ataría el CV al maquetado del panel. El coste es duplicar maquetación, que aquí es deliberadamente distinta.
- **`ExperienciaItem` recibe `conocimiento` por props**, al contrario que `ExperienciaCard`, que llama a `useConocimientoStore`. El endpoint `/curriculum` ya trae los conocimientos; usar el store obligaría a lanzar `getConocimiento()` desde la vista pública para resolver nombres que ya están en memoria.
- **Iconos como SVG en `public/icons/`**, no PNG ni librería. El requisito pide ficheros en `public/icons`; el SVG escala, pesa poco, hereda el color con `currentColor` y puede escribirse en el repo (un PNG no).
- **`getIcons` se corrige y se conserva** en lugar de eliminarlo por rutas literales. Ya existía con el caso `sobre`, y centralizar la ruta evita repetir el error de `/public/` que tenía.
- **Se tipa el currículum en esta spec.** Era tentador dejarlo fuera, pero los cuatro listados nuevos se escriben contra esos datos: hacerlo sobre `perfil: any` y sobre una `CurriculumState` que no coincide con lo que el slice guarda significa programar a ciegas. Además, las claves reales son `formaciones` y `formacionesComplementarias`, un desajuste que solo se ve al tipar.
- **La ordenación se hace en el frontend, sobre copias del array.** Ordenar en el backend afectaría también a las páginas de administración y es otra spec; `sort` muta, y el array viene de Redux, así que se copia con `[...lista]`.
- **Mensaje de vacío por pestaña, sin indicador de carga.** Ninguna página del proyecto usa hoy `loading`; introducirlo solo aquí crearía un patrón huérfano. Descartado también deshabilitar las pestañas vacías: el visitante debe poder comprobar que la sección existe y está vacía.
- **El PDF exporta solo la pestaña activa.** Es la consecuencia natural de las pestañas y no se compensa en esta spec: hacerlo bien exige renderizar las cuatro secciones fuera de pantalla, que es un problema distinto y con sus propios riesgos de maquetación. El scroll propio del panel agrava la limitación: la exportación captura solo la parte visible del panel, no la pestaña entera.
- **El panel de pestañas tiene scroll propio ajustado a la ventana**, con `max-height: calc(100vh - 220px)`. Decidido durante la implementación para que la tarjeta de foto y contacto no se pierda al recorrer un listado largo. El valor es un número mágico calibrado a ojo sobre el hueco de cabecera, nombre y descripción; si el maquetado superior cambia, hay que reajustarlo.
- **La foto usa `perfil.foto` con respaldo en `/references/foto.jpg`.** El campo se edita desde la SPEC 07 y hasta ahora no se pintaba en ninguna parte; el respaldo evita que un perfil sin foto deje un hueco roto.

## Riesgos identificados

| Riesgo | Mitigación |
| ------ | ---------- |
| Cambiar `CurriculumState` rompe la compilación de `slice.ts`, `useCurriculumStore.ts` y `MainPage.tsx` a la vez | Los pasos 3 a 5 van seguidos y el plan indica que los errores intermedios de `tsc` son esperados hasta cerrar el paso 5 |
| Los datos guardados antes de esta spec pueden traer `fechaInicio` o `fechaFin` vacías o mal formadas, y `new Date(undefined)` da `Invalid Date` | El `sort` trata las fechas ausentes como el valor más antiguo y `fechaFin` solo se pinta cuando existe, igual que hacen hoy las cards |
| `sort` sobre el array que viene de Redux lanzaría un error de mutación en modo estricto | Ordenar siempre sobre una copia con `[...lista].sort(...)`, indicado en el paso 9 |
| El PDF sale incompleto y se percibe como un fallo, no como una limitación | Declarado fuera de alcance y anotado en el TODO como tarea pendiente independiente |
| Los iconos SVG no se ven si se colocan en `src/assets` o si la ruta conserva el `/public/` actual | Criterio de aceptación explícito sobre ausencia de 404 y sobre que `getIcons` no devuelva rutas con `/public/` |
| El bloque de contacto puede desbordar la columna de la foto con direcciones o emails largos | La columna ya tiene un ancho fijo por la foto (300px); las filas de contacto ajustan el texto y se comprueba visualmente con el dato más largo |
| Reutilizar el nombre `Curriculum` colisiona con `src/Curriculum.tsx`, que es la raíz de la aplicación | Los componentes nuevos viven en `src/pages/curriculum/` y ninguno se llama `Curriculum`; solo el módulo de estilos lleva ese nombre |
