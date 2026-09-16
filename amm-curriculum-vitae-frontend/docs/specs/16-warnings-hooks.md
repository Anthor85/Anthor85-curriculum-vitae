# SPEC 16 — Eliminar los warnings de `react-hooks`

> **Estado:** Implementada
> **Depende de:** SPEC 08 (`08-mensaje-accion-formularios.md`, Implementada), que fija el comportamiento de `MensajeAccion`; SPEC 12 (`12-tests-paginas-vitest.md`, Implementada) y SPEC 13 (`13-tests-componentes-vitest.md`, Implementada), que son la red de seguridad de este refactor; SPEC 14 (`14-login-rutas-protegidas.md`, Implementada), que añadió `Login.tsx` como sexto consumidor de `MensajeAccion`
> **Fecha:** 2026-09-14 · **Revisada:** 2026-09-16 (tras `crearPaginaCrud`, `crearCrudStore` y el remontaje por `key` de los formularios)
> **Objetivo:** Dejar `npm run lint` sin ningún warning, quitando de raíz los 5 avisos de `react-hooks` que quedan, y endurecer las reglas en `eslint.config.mjs` para que no vuelvan, sin cambiar nada de lo que el usuario ve ni de lo que comprueban los tests.

## Situación de partida

`npm run verify` termina en verde salvo por 5 warnings de lint, todos de `react-hooks`:

| Regla                             | Fichero                              | Causa                                                                |
| --------------------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| `react-hooks/set-state-in-effect` | `components/MensajeAccion.tsx`       | `setTextoVisible('')` en el cuerpo del efecto cuando no hay mensaje  |
| `react-hooks/exhaustive-deps`     | `helpers/crearPaginaCrud.tsx:83`     | Efecto de carga con `[]`; usa `lista`, `get` y `mostrarError`        |
| `react-hooks/exhaustive-deps`     | `pages/Curriculum.tsx:25`            | Efecto de carga con `[]`; usa `curriculum` y `getCurriculum`         |
| `react-hooks/exhaustive-deps`     | `pages/Perfil.tsx:27`                | Efecto de carga con `[]`; usa `perfil`, `getPerfil` y `mostrarError` |
| `react-hooks/exhaustive-deps`     | `pages/forms/ExperienciaForm.tsx:63` | Efecto de carga con `[]`; usa `conocimiento` y `getConocimiento`     |

### Lo que ya está hecho (no forma parte de esta spec)

La primera versión de esta spec contaba 13 warnings. Desde entonces:

- Las cuatro páginas CRUD (`Conocimiento`, `Experiencia`, `Formacion`, `FormacionComplementaria`) se generan con `crearPaginaCrud`, así que sus cuatro efectos de carga son ahora **uno solo**.
- Los cinco formularios ya derivan su estado inicial de la entidad con un inicializador perezoso y se remontan por `key` (`crearPaginaCrud.tsx:106`, `Perfil.tsx:36`). Los cinco `set-state-in-effect` de formularios ya no existen.
- `@typescript-eslint/no-explicit-any` ya está a cero, que era lo que impedía endurecer las reglas.

La causa de los 5 restantes es una sola: **efectos de carga con `[]` que mienten sobre sus dependencias porque las funciones del store y de `useMensajeAccion` se recrean en cada render**, más el caso aislado de `MensajeAccion`.

## Alcance

**Dentro:**

- `src/hooks/useMensajeAccion.ts`: `mostrarMensaje` y `mostrarError` estables con `useCallback`.
- `src/helpers/crearCrudStore.ts`: `get` estable con `useCallback` y sin depender de `lista`.
- `src/hooks/useCurriculumStore.ts` y `src/hooks/usePerfilStore.ts`: `getCurriculum` y `getPerfil` estables con `useCallback`.
- `crearPaginaCrud.tsx`, `Curriculum.tsx`, `Perfil.tsx` y `ExperienciaForm.tsx`: efectos de carga con dependencias completas.
- `src/components/MensajeAccion.tsx`: se parte en un componente externo (API pública intacta) y uno interno remontado por `key={mensaje.id}`, de modo que el efecto solo crea temporizadores.
- `eslint.config.mjs`: quitar los `warn` heredados de `set-state-in-effect` y `no-explicit-any` (vuelven a su nivel por defecto) y subir `exhaustive-deps` a `error`, borrando el comentario "Codigo heredado…".

**Fuera de alcance (para futuras specs):**

- Migrar los `<button>` planos de los formularios al componente `Button` (spec propia, ya prevista).
- Mover las llamadas de carga a `createAsyncThunk` o a RTK Query. Es un cambio de arquitectura del store, no un arreglo de lint.
- `useCallback` en las funciones de escritura (`create`, `update`, `remove`, `guardarPerfil`): no se usan dentro de efectos.
- Añadir tests nuevos. Es un refactor sin cambio de comportamiento: la prueba es que los 184 tests actuales siguen pasando sin tocarlos.
- Tocar `useAuthStore`, `Login.tsx` o los efectos de `Router`, `Tabs`, `MultiSelect` y los de `document.title`/favicon de `Curriculum`: no tienen warnings.

## Patrones a aplicar

### 1. Funciones estables con `useCallback`

En `useMensajeAccion`, las dos funciones ya usan la forma funcional de `setMensaje`, así que no dependen de nada:

```ts
const mostrarMensaje = useCallback(
  (texto: string) =>
    setMensaje((anterior) => ({ texto, id: (anterior?.id ?? 0) + 1 })),
  [],
);

const mostrarError = useCallback(
  () => mostrarMensaje(MENSAJE_ERROR),
  [mostrarMensaje],
);
```

En `useCurriculumStore` y `usePerfilStore`, `getX` solo usa `dispatch` y `api`:

```ts
const getPerfil = useCallback(async () => {
  /* … igual que ahora … */
}, [dispatch]);
```

En `crearCrudStore`, `get` hoy hace `dispatch(setAccion([...(lista ?? []), ...data]))`, lo que la ata a `lista`. Solo se llama cuando `lista === null` (guarda de `crearPaginaCrud` y de `ExperienciaForm`), así que el resultado es idéntico a `dispatch(setAccion(data))`. Se simplifica y la función queda estable:

```ts
const get = useCallback(async () => {
  try {
    const { data } = await api.get<T[]>(endpoint);
    dispatch(setAccion(data));
    return true;
  } catch (error) {
    console.error(`Error obteniendo ${nombre}:`, error);
    return false;
  }
}, [dispatch]);
```

`useCallback` dentro de `useCrudStore` es válido: ya se llama `use…` precisamente para que la regla de hooks lo acepte.

### 2. Efectos de carga con dependencias completas

Con las funciones estables, cada efecto declara lo que usa y el array deja de mentir:

```tsx
// crearPaginaCrud.tsx
useEffect(() => {
  if (lista === null)
    get().then((obtenido) => {
      if (!obtenido) mostrarError();
    });
}, [lista, get, mostrarError]);
```

| Fichero               | Dependencias                        | Guarda                  |
| --------------------- | ----------------------------------- | ----------------------- |
| `crearPaginaCrud.tsx` | `[lista, get, mostrarError]`        | `lista === null`        |
| `Curriculum.tsx`      | `[curriculum, getCurriculum]`       | `!curriculum`           |
| `Perfil.tsx`          | `[perfil, getPerfil, mostrarError]` | `perfil === null`       |
| `ExperienciaForm.tsx` | `[conocimiento, getConocimiento]`   | `conocimiento === null` |

No hay bucle: el efecto se reevalúa cuando el dato pasa de `null` a un valor, y la guarda corta.

**Cambio de guarda en `ExperienciaForm`:** hoy es `!conocimiento || conocimiento.length === 0`. Con dependencias completas, si el backend devuelve una lista vacía, `setAccion([])` crea un array nuevo, el efecto se reevalúa, `length === 0` vuelve a pedir… y así sin fin. La guarda pasa a `conocimiento === null`, igual que en `crearPaginaCrud`. El único efecto visible: con cero conocimientos en el backend, entrar en `/experiencia` ya no repite la petición en cada montaje. Es aceptable (y más correcto).

**Caso `Perfil`:** un 404 en `getPerfil` devuelve `true` sin despachar, así que `perfil` sigue `null` y las dependencias no cambian: el efecto no se relanza. Sin bucle.

**Caso `Curriculum`:** si `getCurriculum` falla, `curriculum` sigue `null` y las dependencias no cambian: tampoco se relanza. Mismo comportamiento que hoy.

### 3. `MensajeAccion`: el efecto solo crea temporizadores

El `setTextoVisible('')` del cuerpo del efecto (y el de `animarTexto`) solo existe para borrar el texto del mensaje anterior. Si cada mensaje estrena componente, sobra. `mensaje` ya trae un `id` incremental, así que sirve de `key` sin tocar los seis sitios que pintan `<MensajeAccion mensaje={mensaje} />` (cinco formularios y `Login`):

```tsx
const TextoAnimado = ({ texto }: { texto: string }) => {
  const [textoVisible, setTextoVisible] = useState('');

  useEffect(() => animarTexto(texto, setTextoVisible), [texto]);

  return textoVisible;
};

export const MensajeAccion = ({ mensaje }: Props) => (
  <span className={styles.MensajeAccion} aria-live="polite">
    {mensaje?.texto && <TextoAnimado key={mensaje.id} texto={mensaje.texto} />}
  </span>
);
```

- El `<span aria-live="polite">` es siempre el mismo nodo: el lector de pantalla no pierde la región viva entre mensajes, y `textoMensaje()` de `test/utils` lo sigue encontrando (vacío sin mensaje).
- Dentro de `animarTexto` desaparece el `setTextoVisible('')` inicial.

## Plan de implementación

1. `useMensajeAccion`: `useCallback` en `mostrarMensaje` y `mostrarError`. Comprobación: `npm test` en verde.
2. `crearCrudStore`, `useCurriculumStore`, `usePerfilStore`: `useCallback` con `[dispatch]` en `get`/`getCurriculum`/`getPerfil`; en `crearCrudStore`, `get` despacha `data` sin concatenar. Comprobación: `npm run typecheck` y `npm test` en verde.
3. `crearPaginaCrud`, `Curriculum`, `Perfil`: cerrar los arrays de dependencias según la tabla. Comprobación: `npm run lint` sin `exhaustive-deps` en esos ficheros, y en la pestaña de red **una** llamada por recurso al entrar en cada página.
4. `ExperienciaForm`: cerrar el array y cambiar la guarda a `conocimiento === null`. Comprobación: el `MultiSelect` de tecnologías se puebla al abrir `/experiencia`, y con la lista vacía en el backend no hay peticiones repetidas.
5. `MensajeAccion`: extraer `TextoAnimado` y quitar los dos `setTextoVisible('')`. Comprobación: `npm test -- MensajeAccion` y los tests de página que usan `avanzarMensaje`.
6. `eslint.config.mjs`: quitar las líneas `warn` de `no-explicit-any` y `set-state-in-effect` y su comentario; añadir `'react-hooks/exhaustive-deps': 'error'`. Comprobación: `npm run lint` con 0 problemas.
7. `npm run verify` completo.
8. Prueba manual contra el backend: entrar en las cinco páginas privadas y en `/`, crear, editar y borrar una entidad en cada una, y comprobar que el mensaje de acción se escribe y se borra igual que antes.
9. `npm run test:coverage` para confirmar que el umbral global del 80% se mantiene.

## Criterios de aceptación

- [ ] `npm run lint` termina con 0 errores y 0 warnings.
- [ ] `eslint.config.mjs` ya no tiene overrides a `warn` para `no-explicit-any` ni `set-state-in-effect`, y `exhaustive-deps` está en `error`.
- [ ] Ningún `useEffect` del proyecto lleva un array de dependencias incompleto ni un `eslint-disable` de reglas de `react-hooks`.
- [ ] `get` de `crearCrudStore`, `getCurriculum`, `getPerfil`, `mostrarMensaje` y `mostrarError` mantienen la misma referencia entre renders.
- [ ] Cada página privada y `/` hacen una sola llamada de carga al montarse, incluso con listas vacías en el backend.
- [ ] Al crear el perfil, el formulario queda relleno con el perfil guardado y el botón pasa a "Actualizar Perfil".
- [ ] `MensajeAccion` escribe y borra el texto letra a letra igual que antes, y sin mensaje el `<span aria-live="polite">` existe y está vacío.
- [ ] Dos mensajes seguidos no se solapan: el segundo empieza desde vacío.
- [ ] `npm test` pasa los 184 tests **sin modificar ningún archivo de `test/`**.
- [ ] `npm run test:coverage` sigue en verde con el umbral global del 80%.
- [ ] `npm run verify` y `npm run build` terminan en verde.

## Decisiones tomadas y descartadas

- **Sí:** `useCallback` dentro de los hooks de store y de `useMensajeAccion`, no en cada consumidor. Se arregla en un sitio y se benefician todos.
- **Sí:** `get` de `crearCrudStore` despacha `data` directamente. Concatenar con `lista` solo tenía efecto si `lista` no era `null`, y ese caso nunca se da; mantenerlo obligaría a meter `lista` en las dependencias y la función dejaría de ser estable.
- **Sí:** guarda `=== null` en `ExperienciaForm`. `length === 0` con dependencias completas provoca un bucle de peticiones cuando el backend no tiene conocimientos.
- **No:** `eslint-disable-next-line` en los efectos de carga. Silencia el aviso sin arreglar nada.
- **No:** `useCallback` en las funciones de escritura. No se usan en efectos; envolverlas sería ruido.
- **Sí:** partir `MensajeAccion` en dos componentes en vez de poner la `key` en los seis consumidores. La API pública no cambia.
- **Sí:** el `<span aria-live>` como nodo fijo y `TextoAnimado` dentro. Una región viva que aparece y desaparece anuncia peor en lector de pantalla.
- **Sí:** endurecer las reglas en esta spec. El motivo para posponerlo (`no-explicit-any` avisando) ya no existe.
- **No:** tocar los tests. Si hay que cambiar un test, el refactor cambió comportamiento y el problema está en el código.

## Riesgos identificados

| Riesgo                                                                                               | Mitigación                                                                                                                            |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Cerrar el array de dependencias provoca un bucle de peticiones                                       | Todas las guardas son `null`/falsy sobre el dato, no sobre su longitud; el paso 3 y 4 lo verifican en la pestaña de red               |
| Un `useCallback` con dependencia olvidada deja una función con datos rancios                         | Las `getX` solo usan `dispatch`, `api` y constantes del cierre de `crearCrudStore`; `exhaustive-deps` (ya en `error`) vigila el array |
| Quitar la concatenación en `get` pierde datos si algún día se llama con lista cargada                | Hoy no ocurre; si se necesitara recargar, reemplazar la lista es lo correcto, no duplicar elementos                                   |
| `TextoAnimado` sin el `setTextoVisible('')` inicial arrastra texto del mensaje anterior              | No puede: la `key` es el `id` del mensaje, así que cada mensaje estrena componente y estado                                           |
| Remontar el formulario al cambiar de entidad corta la animación de `MensajeAccion` a media escritura | Ya ocurre hoy con la `key` de los formularios; ningún test ni caso de uso depende de ese solapamiento                                 |
| Subir reglas a `error` rompe el build por código nuevo aún no escrito                                | Es lo buscado: el lint queda a cero con esta spec y `verify` ya corre lint antes que los tests                                        |
| El refactor se lleva por delante algún caso que los tests no cubren                                  | El paso 8 recorre a mano crear, editar y borrar en todas las páginas contra el backend real                                           |
