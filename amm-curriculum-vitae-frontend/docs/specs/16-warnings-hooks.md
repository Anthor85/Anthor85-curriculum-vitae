# SPEC 16 — Eliminar los warnings de `react-hooks`

> **Estado:** Pendiente
> **Depende de:** SPEC 08 (`08-mensaje-accion-formularios.md`, Implementada), que fija el comportamiento de `MensajeAccion`; SPEC 12 (`12-tests-paginas-vitest.md`, Implementada) y SPEC 13 (`13-tests-componentes-vitest.md`, Implementada), que son la red de seguridad de este refactor; SPEC 14 (`14-login-rutas-protegidas.md`, Implementada), que añadió `useAuthStore` y `Login.tsx`
> **Fecha:** 2026-09-14
> **Objetivo:** Dejar `npm run lint` sin warnings de hooks, quitando de raíz los 6 avisos de `react-hooks/set-state-in-effect` y los 7 de `react-hooks/exhaustive-deps`, sin cambiar nada de lo que el usuario ve ni de lo que comprueban los tests.

## Situación de partida

`npm run verify` termina en verde salvo por 13 warnings de lint, de dos familias:

| Regla                             | Ficheros                                                                                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react-hooks/set-state-in-effect` | `MensajeAccion.tsx:58`, `ConocimientoForm.tsx:38`, `ExperienciaForm.tsx:49`, `FormacionForm.tsx:38`, `FormacionComplementariaForm.tsx:40`, `PerfilForm.tsx:33`    |
| `react-hooks/exhaustive-deps`     | `Conocimiento.tsx:54`, `Curriculum.tsx:24`, `Experiencia.tsx:53`, `Formacion.tsx:51`, `FormacionComplementaria.tsx:58`, `Perfil.tsx:27`, `ExperienciaForm.tsx:45` |

Los dos son el mismo antipatrón visto por dos lados: **estado que se sincroniza por efecto en vez de derivarse**, y **efectos de carga inicial con `[]` que mienten sobre sus dependencias porque las funciones del store se recrean en cada render**.

Ambas reglas están en `warn` en `eslint.config.mjs`, con el comentario "Codigo heredado usa 'any' y setState en efectos: avisar, no romper el build". Esta spec elimina la causa; subir las reglas a `error` queda **fuera de alcance** mientras `@typescript-eslint/no-explicit-any` siga avisando.

## Alcance

**Dentro:**

- Los cinco formularios de `src/pages/forms/`: se elimina el `useEffect` que sincroniza el estado local con la entidad en edición y se sustituye por un inicializador puro más el remontaje por `key` desde la página.
- Las cinco páginas de edición (`Conocimiento`, `Experiencia`, `Formacion`, `FormacionComplementaria`, `Perfil`): pasan la `key` al formulario y cierran su `useEffect` de carga con dependencias completas.
- `src/pages/Curriculum.tsx`: efecto de carga con dependencias completas.
- `src/components/MensajeAccion.tsx`: se parte en un componente externo (API pública intacta) y uno interno remontado por `key={mensaje.id}`, de modo que el efecto solo crea temporizadores y no llama a `setState` en su cuerpo.
- Los `useXStore` de `src/hooks/` implicados: las funciones que se usan dentro de efectos (`getConocimiento`, `getCurriculum`, `getExperiencia`, `getFormacion`, `getFormacionComplementaria`, `getPerfil`) pasan a ser estables con `useCallback`.
- `src/hooks/useMensajeAccion.ts`: `mostrarMensaje` y `mostrarError` estables con `useCallback`.
- El segundo efecto de `ExperienciaForm` (el que precarga conocimientos para el `MultiSelect`), con dependencias completas.

**Fuera de alcance (para futuras specs):**

- Subir `react-hooks/set-state-in-effect` a `error` en `eslint.config.mjs`. Se hará cuando el resto de warnings (`no-explicit-any`) también estén a cero.
- Los warnings de `@typescript-eslint/no-explicit-any` y el tipado del código heredado.
- Migrar los `<button>` planos de los formularios al componente `Button` (spec propia, ya prevista).
- Mover las llamadas de carga a `createAsyncThunk` o a RTK Query. Es un cambio de arquitectura del store, no un arreglo de lint.
- Añadir tests nuevos. Esta spec es un refactor sin cambio de comportamiento: la prueba es que los 131 tests actuales siguen pasando sin tocarlos.
- Tocar `useAuthStore` y `Login.tsx`: no tienen ningún warning.

## Patrones a aplicar

### 1. Formularios: inicializador puro + `key`

Hoy los cinco formularios repiten esto:

```tsx
const [datosPerfil, setDatosPerfil] = useState<PerfilPayload>(PERFIL_VACIO);

useEffect(() => {
  if (!perfil) {
    setDatosPerfil(PERFIL_VACIO);
    return;
  }

  setDatosPerfil({
    ...perfil,
    fechaNacimiento: perfil.fechaNacimiento?.slice(0, 10) ?? '',
    foto: perfil.foto ?? '',
  });
}, [perfil]);
```

Pasa a esto: la transformación se saca a una función pura a nivel de módulo y se usa como estado inicial perezoso; el efecto desaparece.

```tsx
const aDatosPerfil = (perfil: Perfil | null): PerfilPayload => {
  if (!perfil) return PERFIL_VACIO;

  return {
    ...perfil,
    fechaNacimiento: perfil.fechaNacimiento?.slice(0, 10) ?? '',
    foto: perfil.foto ?? '',
  };
};

// dentro del componente
const [datosPerfil, setDatosPerfil] = useState<PerfilPayload>(() =>
  aDatosPerfil(perfil),
);
```

Y la página remonta el formulario cuando cambia la entidad en edición:

```tsx
<PerfilForm
  key={perfil?.id ?? 'nuevo'}
  perfil={perfil}
  onSubmitPerfil={enviarPerfil}
  mensaje={mensaje}
/>
```

La `key` de cada página:

| Página                    | Formulario                    | `key`                                             |
| ------------------------- | ----------------------------- | ------------------------------------------------- |
| `Conocimiento`            | `ConocimientoForm`            | `conocimientoEnEdicion?.id ?? 'nuevo'`            |
| `Experiencia`             | `ExperienciaForm`             | `experienciaEnEdicion?.id ?? 'nuevo'`             |
| `Formacion`               | `FormacionForm`               | `formacionEnEdicion?.id ?? 'nuevo'`               |
| `FormacionComplementaria` | `FormacionComplementariaForm` | `formacionComplementariaEnEdicion?.id ?? 'nuevo'` |
| `Perfil`                  | `PerfilForm`                  | `perfil?.id ?? 'nuevo'`                           |

Comportamiento que **no** cambia:

- Pulsar "Editar" en otra tarjeta remonta el formulario con los datos de esa entidad, igual que hoy hacía el efecto.
- "Limpiar" sigue llamando a `onLimpiar()` y a su `setX(VACIO)` local; además la `key` vuelve a `'nuevo'`.
- Tras **crear** una entidad nueva el formulario conserva lo escrito, exactamente como hoy: la `key` sigue siendo `'nuevo'` y el efecto tampoco se disparaba.
- `Perfil` es el caso especial: al crear el perfil, `perfil?.id` pasa de `undefined` a un id real, el formulario se remonta y se repuebla desde el perfil guardado. Hoy el efecto hacía justo eso.

### 2. `MensajeAccion`: el efecto solo crea temporizadores

El `setTextoVisible('')` del cuerpo del efecto solo existe para borrar el texto del mensaje anterior. Si cada mensaje estrena componente, sobra. `mensaje` ya trae un `id` incremental (`useMensajeAccion`), así que sirve de `key` sin tocar los seis sitios que pintan `<MensajeAccion mensaje={mensaje} />`:

```tsx
export const MensajeAccion = ({ mensaje }: Props) => {
  if (!mensaje?.texto)
    return <span className={styles.MensajeAccion} aria-live="polite" />;

  return <TextoAnimado key={mensaje.id} texto={mensaje.texto} />;
};
```

`TextoAnimado` arranca con `useState('')` y su efecto se limita a `return animarTexto(texto, setTextoVisible)`; dentro de `animarTexto` desaparece el `setTextoVisible('')` inicial, que ya es redundante. El `<span aria-live="polite">` se pinta siempre, con o sin mensaje, para que `textoMensaje()` de `test/utils` lo siga encontrando y devuelva `''`.

### 3. Efectos de carga: `useCallback` en los stores y dependencias completas

En cada `useXStore`, las funciones usadas dentro de efectos se envuelven:

```tsx
const getPerfil = useCallback(async () => {
  /* … igual que ahora … */
}, [dispatch]);
```

`dispatch` es estable, así que la función pasa a serlo. Lo mismo con `mostrarMensaje` y `mostrarError` en `useMensajeAccion`, que ya usan la forma funcional de `setMensaje` y quedan con dependencias `[]`.

Con eso, los efectos de página pueden declarar lo que de verdad usan y el array deja de mentir:

```tsx
useEffect(() => {
  if (perfil === null)
    getPerfil().then((obtenido) => {
      if (!obtenido) mostrarError();
    });
}, [perfil, getPerfil, mostrarError]);
```

No hay bucle: el efecto se vuelve a evaluar cuando `perfil` pasa de `null` a un valor, y entonces la guarda corta. En `ExperienciaForm` el efecto de conocimientos queda con `[conocimiento, getConocimiento]` y su guarda `if (!conocimiento || conocimiento.length === 0)`.

Solo las funciones citadas necesitan `useCallback`; las de escritura (`createX`, `updateX`, `deleteX`) no se usan dentro de efectos y se dejan como están.

## Plan de implementación

1. `useMensajeAccion`: `useCallback` en `mostrarMensaje` y `mostrarError`. Comprobación: `npm test` en verde.
2. Los `useXStore` implicados: `useCallback` con `[dispatch]` en la función `getX` de cada uno. Comprobación: `npm run typecheck` y `npm test` en verde.
3. `Curriculum.tsx` y las cinco páginas de edición: cerrar los arrays de dependencias con lo que el efecto usa de verdad. Comprobación: `npm run lint` ya no reporta `exhaustive-deps`, y en el navegador la pestaña de red muestra **una** llamada por recurso al entrar en cada página.
4. `ExperienciaForm`: cerrar el array del efecto de conocimientos. Comprobación: el `MultiSelect` de tecnologías sigue poblándose al abrir `/experiencia`.
5. Formulario por formulario (en este orden: `ConocimientoForm`, `FormacionForm`, `FormacionComplementariaForm`, `PerfilForm`, `ExperienciaForm`), sacar la transformación a una función pura de módulo, usarla como estado inicial perezoso, borrar el `useEffect` y añadir la `key` en la página correspondiente. Comprobación tras cada uno: `npm test -- <Pagina>` en verde.
6. `MensajeAccion`: extraer `TextoAnimado`, quitar la guarda del efecto y el `setTextoVisible('')` inicial de `animarTexto`, y pintar siempre el `<span aria-live="polite">`. Comprobación: `npm test -- MensajeAccion` y los tests de página que usan `avanzarMensaje`.
7. `npm run verify` completo: lint sin warnings de hooks, typecheck, formato y los 131 tests.
8. Prueba manual contra el backend: entrar en las cinco páginas privadas, crear, editar y borrar una entidad en cada una, y comprobar que el mensaje de acción se escribe y se borra igual que antes.
9. `npm run test:coverage` para confirmar que el umbral global del 80% se mantiene.

## Criterios de aceptación

- [ ] `npm run lint` no reporta ningún `react-hooks/set-state-in-effect` ni `react-hooks/exhaustive-deps`.
- [ ] Ningún `useEffect` del proyecto lleva un array de dependencias incompleto ni un `eslint-disable` de estas dos reglas.
- [ ] Los cinco formularios ya no tienen el `useEffect` de sincronización; su estado inicial sale de una función pura.
- [ ] Pulsar "Editar" en una tarjeta carga sus datos en el formulario en las cinco páginas.
- [ ] Pulsar "Limpiar" deja el formulario vacío y sale del modo edición.
- [ ] Tras crear una entidad, el formulario se comporta igual que antes de esta spec.
- [ ] Al crear el perfil, el formulario queda relleno con el perfil guardado y el botón pasa a "Actualizar Perfil".
- [ ] `MensajeAccion` escribe y borra el texto letra a letra igual que antes, y sin mensaje el `<span aria-live="polite">` existe y está vacío.
- [ ] Dos mensajes seguidos no se solapan: el segundo empieza desde vacío.
- [ ] Cada página de edición hace una sola llamada de carga al montarse.
- [ ] `npm test` pasa los 131 tests **sin modificar ningún archivo de `test/`**.
- [ ] `npm run test:coverage` sigue en verde con el umbral global del 80%.
- [ ] `npm run verify` termina en verde de principio a fin.
- [ ] `npm run build` sin errores nuevos.

## Decisiones tomadas y descartadas

- **Sí:** remontar por `key` en vez de sincronizar por efecto. Es el patrón que recomienda React para resetear estado cuando cambia una prop, deja el formulario sin efectos y elimina el render intermedio con los datos de la entidad anterior.
- **No:** el patrón de "ajustar estado durante el render" (guardar el `id` anterior en un `useState` y compararlo). Evita el efecto pero mete dos `useState` de fontanería en cada formulario y se lee peor que una `key`.
- **No:** `eslint-disable-next-line` en los efectos de carga. Silencia el aviso sin arreglar nada y deja el proyecto con siete excepciones que nadie revisará.
- **Sí:** `useCallback` dentro de los `useXStore`, no en cada página. Se arregla en un sitio y se benefician todos los consumidores, presentes y futuros.
- **No:** `useCallback` en las funciones de escritura. No se usan en efectos; envolverlas sería ruido.
- **Sí:** partir `MensajeAccion` en dos componentes en vez de poner la `key` en los seis sitios que lo pintan. La API pública del componente no cambia y los formularios no se enteran.
- **Sí:** pintar el `<span aria-live="polite">` también sin mensaje. Un contenedor `aria-live` que aparece y desaparece anuncia peor en lector de pantalla, y `textoMensaje()` de `test/utils` lo sigue encontrando.
- **No:** tocar los tests. Si hay que cambiar un test, es que el refactor cambió comportamiento y el problema está en el código, no en el test.
- **No:** subir las reglas a `error` en esta spec. El comentario de `eslint.config.mjs` cubre también `no-explicit-any`, que sigue avisando; se endurece todo junto cuando el lint esté limpio del todo.

## Riesgos identificados

| Riesgo                                                                                                          | Mitigación                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cerrar el array de dependencias provoca un bucle de peticiones                                                  | Todos los efectos afectados tienen guarda (`x === null`, `length === 0`); el paso 3 lo verifica en la pestaña de red antes de seguir                      |
| Un `useCallback` mal escrito (dependencia olvidada) deja una función con datos rancios                          | Las `getX` solo usan `dispatch` y `api`, no leen estado del componente; y la propia regla `exhaustive-deps` vigila el array del `useCallback`             |
| Remontar el formulario al cambiar de entidad corta la animación de `MensajeAccion` a media escritura            | Solo ocurre si se cambia de tarjeta mientras se escribe el mensaje, y el siguiente arranca limpio. Ningún test ni caso de uso depende de ese solapamiento |
| `Perfil` remonta el formulario justo después de crear el perfil y se pierde lo escrito                          | Es el comportamiento actual y el deseado: tras crear, el formulario se repuebla desde el perfil guardado. Cubierto por el test de creación de perfil      |
| `TextoAnimado` sin el `setTextoVisible('')` inicial arrastra texto del mensaje anterior                         | No puede: la `key` es el `id` del mensaje, así que cada mensaje estrena componente y estado                                                               |
| El estado inicial perezoso se evalúa una sola vez y algún formulario esperaba recalcularse sin cambiar la `key` | La `key` deriva del `id` de la entidad en edición, que es justo lo que disparaba el efecto hoy. La tabla de `key` de esta spec lo fija por escrito        |
| El refactor se lleva por delante algún caso que los tests no cubren                                             | El paso 8 recorre a mano crear, editar y borrar en las cinco páginas contra el backend real                                                               |
