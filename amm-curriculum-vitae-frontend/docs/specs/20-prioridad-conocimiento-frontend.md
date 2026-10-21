# SPEC 20 — Prioridad de conocimientos en formulario, cards, Curriculum y PDF

> **Estado:** Implementada
> **Depende de:** SPEC 11 del backend (`11-prioridad-conocimiento.md`, Borrador), que sustituye `nivel` por `prioridad` en la API; SPEC 04 (`04-editar-conocimiento-frontend.md`), que fija `ConocimientoForm` y `ConocimientoCard`; SPEC 19 (`19-pdf-texto-real.md`, Implementada), que fija `Competencias clave` en `CurriculumPDF`
> **Fecha:** 2026-10-21
> **Objetivo:** Sustituir en el frontend `nivel` por `prioridad` (`Muy alta`…`Muy baja`), editable en el formulario y visible solo en la card de administración, y ordenar los conocimientos de `Curriculum` y del PDF por prioridad y después alfabéticamente, sin mostrar nunca la prioridad en texto.

## Situación de partida

- `conocimiento.interface.ts` define `ConocimientoNivel` (`Básico`/`Intermedio`/`Avanzado`) y `Conocimiento.nivel`.
- `ConocimientoForm` tiene un `<select id="nivel">` con los tres valores; por defecto `Básico`.
- `ConocimientoCard` pinta `Nivel: {nivel}`.
- `ordenarCurriculum` ordena `conocimientosOrdenados` solo por `titulo` (`localeCompare`).
- La pestaña `Conocimientos` de `Curriculum` pinta `conocimientosOrdenados` en un grid de `ConocimientoItem` (solo título).
- `ExperienciaItem` y el `Puesto` del PDF obtienen las tecnologías con `tecnologiasFilter(experiencia.tecnologias, conocimiento)`, que respeta el orden de `conocimientosOrdenados`.
- `CurriculumPDF` → `Competencias` usa `competenciasClave` para pintar `Competencias clave` con los rótulos `Avanzado` e `Intermedio` (estilo `nivel`) y descarta los `Básico`.

## Alcance

**Dentro:**

- **Interfaz** (`conocimiento.interface.ts`): `ConocimientoNivel` se sustituye por `ConocimientoPrioridad` (`MUY_ALTA = 'Muy alta'`, `ALTA = 'Alta'`, `MEDIA = 'Media'`, `BAJA = 'Baja'`, `MUY_BAJA = 'Muy baja'`, en ese orden) y `Conocimiento.nivel` por `Conocimiento.prioridad`. `ConocimientoPayload` sigue siendo `Omit<Conocimiento, 'id'>`.
- **`ConocimientoForm`**: el `<select>` pasa a `id="prioridad"`, `name="prioridad"`, etiqueta `Prioridad:`, con las cinco opciones en el orden del enum (de `Muy alta` a `Muy baja`). Por defecto `Media` al crear y tras limpiar; en edición carga la del conocimiento.
- **`ConocimientoCard`**: `Nivel: {nivel}` pasa a `Prioridad: {prioridad}`, con la misma guarda si falta.
- **Listado de administración** (`/conocimiento`): sin cambios de orden.
- **`ordenarCurriculum`**: `conocimientosOrdenados` se ordena primero por prioridad (índice en `Object.values(ConocimientoPrioridad)`: `Muy alta` primero) y, a igualdad, por `titulo` con `localeCompare`. Un conocimiento sin `prioridad` o con un valor desconocido se trata como `Media`.
- **Pestaña `Conocimientos` de `Curriculum`**: mismo grid continuo de hoy, sin separadores ni rótulos; solo cambia el orden. La prioridad no aparece en texto ni en atributos visibles.
- **Tecnologías de experiencia** (`ExperienciaItem` en la web y `Puesto` en el PDF): heredan el nuevo orden de `conocimientosOrdenados` sin cambios de código. `ExperienciaCard` (administración) no cambia.
- **`CurriculumPDF` → `Competencias`**:
  - Pinta **todos** los conocimientos recibidos (ya ordenados) como una única lista con viñetas, sin rótulos por grupo.
  - El título de la sección pasa de `Competencias clave` a `Competencias`.
  - Si no hay conocimientos, no se pinta la sección.
  - Se eliminan `ListaCompetencias` con su prop `nivel` y el estilo `styles.nivel`.
  - Desaparecen del PDF los textos `Avanzado`, `Intermedio` y `Básico`.
- **Limpieza**: se eliminan `src/helpers/competenciasClave.ts` y `test/helpers/competenciasClave.test.tsx`.
- **Tests** (Vitest): se adaptan los que usan `ConocimientoNivel`/`nivel` (`CurriculumPDF`, `ordenarCurriculum`, `tecnologiasFilter`, `crearCrudStore`, `Conocimiento`, `Experiencia`) y se añaden los casos del plan.

**Fuera de alcance (para futuras specs):**

- Todo el backend (modelo, API, migración). Va en la SPEC 11 del backend.
- Ordenar las cards de `/conocimiento` o las tecnologías de `ExperienciaCard` y del multiselect de `ExperienciaForm`.
- Separadores visuales entre grupos de prioridad en `Curriculum`.
- Filtrar conocimientos del PDF por prioridad: entran todos.
- Mostrar la prioridad en `Curriculum`, `ConocimientoItem` o el PDF.
- Migrar los `<button>` del formulario al componente `Button`.

## Modelo de datos

```ts
export enum ConocimientoPrioridad {
  MUY_ALTA = 'Muy alta',
  ALTA = 'Alta',
  MEDIA = 'Media',
  BAJA = 'Baja',
  MUY_BAJA = 'Muy baja',
}

export interface Conocimiento {
  id: string;
  titulo: string;
  prioridad: ConocimientoPrioridad;
}

export type ConocimientoPayload = Omit<Conocimiento, 'id'>;
```

El orden del enum es el orden de visualización. Payload que envía el formulario (`POST` y `PUT`):

```json
{ "titulo": "React", "prioridad": "Alta" }
```

Ejemplo de orden resultante en `Curriculum` y PDF: `Ajax, C++, Visual Studio` (Muy alta) → `TypeScript, Unity3D` (Alta) → `Java, Sonata` (Media) → …

## Plan de implementación

1. **Interfaz.** Sustituir `ConocimientoNivel`/`nivel` por `ConocimientoPrioridad`/`prioridad` en `conocimiento.interface.ts`. `tsc` señala los usos pendientes; se resuelven en los pasos siguientes.
2. **Formulario.** Adaptar `ConocimientoForm` (`select` de prioridad, default `MEDIA` en `CONOCIMIENTO_VACIO`). Prueba: crear un conocimiento envía `prioridad: 'Media'` si no se toca el select; editar carga la prioridad guardada.
3. **Card.** `ConocimientoCard` pinta `Prioridad: {prioridad}`. Prueba: la card de un conocimiento `Alta` muestra `Prioridad: Alta`.
4. **Orden.** En `ordenarCurriculum`, ordenar `conocimientosOrdenados` por índice de prioridad y luego por `titulo`. Prueba: `test/helpers/ordenarCurriculum.test.tsx` con el ejemplo del modelo de datos.
5. **PDF.** Reescribir `Competencias` en `CurriculumPDF`: título `Competencias`, lista única con todos, sin `ListaCompetencias` ni `styles.nivel`. Borrar `competenciasClave.ts` y su test. Prueba: `CurriculumPDF.test.tsx`.
6. **Tests.** Adaptar los tests existentes a `prioridad` y añadir:
   - `ordenarCurriculum`: prioridades mezcladas → orden por prioridad y alfabético dentro de cada una; sin `prioridad` se coloca con `Media`.
   - `ConocimientoForm`/`Conocimiento`: el select ofrece las cinco opciones en orden; default `Media`; tras limpiar vuelve a `Media`; el envío lleva `prioridad` y no `nivel`.
   - `ConocimientoCard`: muestra `Prioridad: X`.
   - `Curriculum` (pestaña Conocimientos): los `ConocimientoItem` salen en el orden esperado y ningún texto de prioridad (`Muy alta`, `Alta`, `Media`, `Baja`, `Muy baja`) aparece.
   - `CurriculumPDF`: título `Competencias`, todos los conocimientos (incluidos `Baja`/`Muy baja`) en el orden recibido, sin `Competencias clave`, `Avanzado`, `Intermedio` ni `Básico`; sin conocimientos no se pinta la sección.
   - `ExperienciaItem`/PDF: las tecnologías de un puesto salen en el orden de `conocimientosOrdenados`.
7. `npm test`, `npm run test:coverage`, `tsc` y `eslint` en verde.
8. **End to end** contra el backend local con la SPEC 11 migrada: reclasificar unos cuantos conocimientos desde `/conocimiento`, comprobar el orden en la pestaña `Conocimientos`, en las tecnologías de cada experiencia y en el PDF descargado.
9. **Producción.** Desplegar tras el backend de la SPEC 11 y su migración.

## Criterios de aceptación

- [ ] `src` no contiene referencias a `ConocimientoNivel`, `competenciasClave` ni al campo `nivel` de conocimiento.
- [ ] El formulario muestra `Prioridad:` con las cinco opciones de `Muy alta` a `Muy baja`, en ese orden.
- [ ] Crear un conocimiento sin tocar el select envía `prioridad: 'Media'`; tras limpiar, el select vuelve a `Media`.
- [ ] Editar un conocimiento carga su prioridad y el `PUT` envía la elegida.
- [ ] La card de administración muestra `Prioridad: {valor}`.
- [ ] El orden de las cards de `/conocimiento` no cambia.
- [ ] La pestaña `Conocimientos` de `Curriculum` ordena por prioridad (`Muy alta` primero) y alfabéticamente dentro de cada prioridad, en un grid continuo sin separadores.
- [ ] Ni `Curriculum` ni el PDF muestran ningún texto de prioridad.
- [ ] Las tecnologías de cada experiencia en `Curriculum` y en el PDF siguen el mismo orden.
- [ ] El PDF muestra la sección `Competencias` con todos los conocimientos en ese orden, sin rótulos, y no contiene `Competencias clave`, `Avanzado`, `Intermedio` ni `Básico`.
- [ ] Sin conocimientos, el PDF no pinta la sección `Competencias`.
- [ ] Un conocimiento sin `prioridad` no rompe la vista y se ordena como `Media`.
- [ ] `npm test` y `npm run test:coverage` en verde con el umbral actual; `tsc` y `eslint` sin errores.

## Decisiones

- **Sí:** orden en el frontend, en `ordenarCurriculum`, por índice del enum. **No:** orden en el backend (SPEC 11).
- **Sí:** el orden del enum TypeScript es el de visualización y el del select, para no duplicar una tabla de pesos.
- **Sí:** la card de administración muestra la prioridad; la regla de "no mostrar en texto" aplica a `Curriculum` y PDF (zona pública).
- **Sí:** grid continuo en `Curriculum`. **No:** separadores sin texto: delatarían los grupos.
- **Sí:** las tecnologías de cada experiencia heredan el orden por prioridad: lo relevante primero en cada puesto, sin código extra.
- **Sí:** el PDF incluye todas las prioridades. **No:** descartar `Baja`/`Muy baja` como hoy se descarta `Básico`: el usuario prefiere la lista completa.
- **Sí:** título `Competencias` en vez de `Competencias clave`, porque ya no es una selección.
- **Sí:** borrar `competenciasClave.ts`: sin filtro ni agrupación, la lista ordenada llega ya hecha.
- **Sí:** default `Media` en el formulario, igual que el default del backend y la migración.
- **Sí:** prioridad ausente o desconocida se ordena como `Media`, por robustez durante el despliegue.
- **No:** reordenar `/conocimiento` ni el multiselect de `ExperienciaForm`.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Desplegar el frontend antes que el backend: el `GET` trae `nivel` y no `prioridad` | Orden de despliegue: backend + migración primero. Si ocurre, todo se ordena como `Media` (alfabético) y la card no pinta la prioridad |
| Con todos en `Media` tras la migración, el orden es idéntico al alfabético actual y no se nota el cambio | Esperado; reclasificar a mano desde `/conocimiento` (paso 8) |
| Con todos los conocimientos, la sección `Competencias` alarga la barra lateral del PDF y puede pasar de 2 páginas | La barra lateral es `fixed` y la lista con viñetas fluye; comprobar el PDF real en el paso 8 y, si desborda, abrir spec aparte para filtrar |
| `localeCompare` sin locale ordena distinto acentos o mayúsculas | Mismo comportamiento que hoy; fuera de alcance |
