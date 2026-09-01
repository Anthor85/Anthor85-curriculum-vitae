# SPEC 08 — Mensaje animado de confirmación en los formularios

> **Estado:** Implementada
> **Depende de:** SPEC 07 del frontend (`07-editar-perfil-frontend.md`, Aprobada), que dejó los cinco formularios controlados y con el bloque `styles.actions`
> **Fecha:** 2026-09-01
> **Objetivo:** Mostrar, a la derecha de los botones de acción de cada formulario de administración, un mensaje en `#C72B0E` con el nombre de la entidad y la acción realizada (`creada` / `actualizada` / `eliminada`), que aparece letra a letra en 1 s, se mantiene 3 s y desaparece borrándose desde el final en 1 s.

## Alcance

**Dentro:**

- Nuevo componente `MensajeAccion` (`src/components/MensajeAccion.tsx` + `MensajeAccion.module.scss`) que recibe un mensaje y ejecuta toda la animación de máquina de escribir (entrada 1 s → espera 3 s → salida 1 s).
- Nuevo hook `useMensajeAccion` (`src/hooks/useMensajeAccion.ts`) que expone `mensaje` y `mostrarMensaje(texto)`, exportado desde `src/hooks/index.ts`.
- Nueva interfaz `MensajeAccion` en `src/interfaces/mensajeAccion.interface.ts` (`texto` + `id`), donde el `id` incremental permite relanzar la animación aunque el texto sea idéntico al anterior.
- Los cinco hooks de store (`useFormacionStore`, `useFormacionComplementariaStore`, `useConocimientoStore`, `useExperienciaStore`, `usePerfilStore`) cambian `create*`, `update*`, `delete*` y `guardarPerfil` para **devolver `boolean`**: `true` al final del `try`, `false` en el `catch`. Los `console.error` se mantienen tal cual.
- Las cinco páginas (`Formacion`, `FormacionComplementaria`, `Conocimiento`, `Experiencia`, `Perfil`) poseen el estado del mensaje vía `useMensajeAccion()`, deciden el texto según la acción y el resultado, y pasan `mensaje` al formulario como prop.
- Los cinco formularios (`FormacionForm`, `FormacionComplementariaForm`, `ConocimientoForm`, `ExperienciaForm`, `PerfilForm`) reciben la prop `mensaje` y renderizan `<MensajeAccion mensaje={mensaje} />` como último hijo de `<div className={styles.actions}>`.
- En las páginas con cards, el `deleteX={() => deleteX(f.id)}` inline pasa a ser un handler `eliminarX(id)` que espera el resultado y muestra el mensaje si fue correcto.
- En `Perfil`, el texto distingue `Perfil creado` de `Perfil actualizado` según haya `perfil?.id` **antes** de enviar.

**Fuera de alcance (para futuras specs):**

- La vista pública `/curriculum` (`Curriculum.tsx`): no tiene formularios y no se toca.
- `MainPage.tsx`, el router y los estilos de `Layout.module.scss`.
- Mensajes de error en la interfaz: si la operación falla no se muestra nada y el error se sigue registrando con `console.error`.
- Cambiar el comportamiento actual de `limpiarFormulario()`, que hoy se ejecuta siempre tras el `await` aunque la llamada haya fallado.
- Convertir los `catch` de los stores en `throw` o guardar el error en Redux.
- Confirmación antes de eliminar desde la card.
- `prefers-reduced-motion`, `role="status"` o cualquier otro ajuste de accesibilidad más allá del `aria-live="polite"` que sí lleva el componente.
- Que el mensaje sea configurable en color, duraciones o posición desde fuera del componente.
- Mensajes para `getX` (carga inicial) o para acciones del `MultiSelect` de tecnologías.
- Tests automatizados: el proyecto no tiene suite hoy.

## Modelo de datos

No hay persistencia nueva. Se añade una interfaz de UI en `src/interfaces/mensajeAccion.interface.ts`:

```ts
export interface MensajeAccion {
  texto: string;
  id: number;
}
```

El `id` es un contador incremental: sin él, mostrar dos veces seguidas `Formación eliminada` no cambiaría el estado y el `useEffect` del componente no relanzaría la animación.

Hook `useMensajeAccion` (`src/hooks/useMensajeAccion.ts`):

```ts
export const useMensajeAccion = () => {
  const [mensaje, setMensaje] = useState<MensajeAccion | null>(null);

  const mostrarMensaje = (texto: string) =>
    setMensaje((anterior) => ({ texto, id: (anterior?.id ?? 0) + 1 }));

  return { mensaje, mostrarMensaje };
};
```

Props de `MensajeAccion`:

```ts
interface Props {
  mensaje: MensajeAccion | null;
}
```

Constantes de la animación, en `MensajeAccion.tsx`:

```ts
const DURACION_ENTRADA = 1000;
const DURACION_ESPERA = 3000;
const DURACION_SALIDA = 1000;
```

El paso entre letras es `DURACION_ENTRADA / texto.length` en la entrada y `DURACION_SALIDA / texto.length` en la salida, de modo que cada fase dura 1 s **independientemente de la longitud del texto**.

Prop nueva, idéntica en los cinco formularios:

```ts
mensaje: MensajeAccion | null;
```

Textos por página y acción:

| Página                    | Crear                                | Actualizar                                | Eliminar                                |
| ------------------------- | ------------------------------------ | ----------------------------------------- | --------------------------------------- |
| `Formacion`               | `Formación creada`                   | `Formación actualizada`                   | `Formación eliminada`                   |
| `FormacionComplementaria` | `Formación Complementaria creada`    | `Formación Complementaria actualizada`    | `Formación Complementaria eliminada`    |
| `Experiencia`             | `Experiencia creada`                 | `Experiencia actualizada`                 | `Experiencia eliminada`                 |
| `Conocimiento`            | `Conocimiento creado`                | `Conocimiento actualizado`                | `Conocimiento eliminado`                |
| `Perfil`                  | `Perfil creado`                      | `Perfil actualizado`                      | — (no existe borrado de perfil)         |

Línea de tiempo de la animación para `Formación creada` (16 caracteres, paso de 62,5 ms):

```
t=0.00s  F
t=0.50s  Formación
t=1.00s  Formación creada    ← texto completo
t=4.00s  Formación creada    ← fin de la espera
t=4.50s  Formación
t=5.00s  (vacío)
```

## Plan de implementación

1. Crear `src/interfaces/mensajeAccion.interface.ts` con la interfaz `MensajeAccion`. Prueba: `npx tsc --noEmit` sin errores nuevos.
2. Crear `src/hooks/useMensajeAccion.ts` con el hook descrito y exportarlo desde `src/hooks/index.ts`. Prueba: `npx tsc --noEmit` sigue limpio y el hook se importa desde `'../hooks'`.
3. Crear `src/components/MensajeAccion.module.scss` con la clase `.MensajeAccion`: `color: #C72B0E`, `align-self: center`, `font-weight: 600`, `white-space: nowrap`. Prueba: el build de Vite no reporta errores de SCSS.
4. Crear `src/components/MensajeAccion.tsx`: estado local `textoVisible` (`useState<string>('')`) y un `useEffect` con dependencia `[mensaje]` que, si `mensaje` es `null` o su texto está vacío, deja `textoVisible` en `''`; si no, arranca un `setInterval` de entrada que va haciendo `texto.slice(0, n)` con `n` creciente, al completarse programa un `setTimeout` de `DURACION_ESPERA` y después un `setInterval` de salida que decrementa `n` hasta `0`. La función de limpieza del `useEffect` cancela los tres temporizadores, lo que garantiza tanto el reinicio ante un mensaje nuevo como que no queden temporizadores vivos al desmontar. Renderiza `<span className={styles.MensajeAccion} aria-live="polite">{textoVisible}</span>`. Prueba: montarlo en una página con un texto fijo y verificar los cinco segundos del ciclo.
5. En `useFormacionStore`, hacer que `createFormacion`, `updateFormacion` y `deleteFormacion` devuelvan `true` al final del `try` y `false` en el `catch`, sin tocar los `dispatch` ni los `console.error`. Prueba: `await createFormacion(payload)` devuelve `true` con el backend arriba y `false` con el backend apagado.
6. Repetir el paso 5 en `useFormacionComplementariaStore`, `useConocimientoStore` y `useExperienciaStore`. Prueba: `npx tsc --noEmit` limpio y las tres páginas siguen funcionando igual.
7. En `usePerfilStore`, devolver `boolean` en `createPerfil` y `updatePerfil`; `guardarPerfil` ya propaga el retorno de ambas con su `return`. Prueba: guardar el perfil devuelve `true`.
8. Añadir a los cinco formularios la prop `mensaje: MensajeAccion | null` y renderizar `<MensajeAccion mensaje={mensaje} />` como último hijo de `<div className={styles.actions}>`, después del botón `Borrar formulario` (en `PerfilForm`, después del botón de submit). Prueba: pasando un mensaje a mano desde la página, aparece a la derecha de los botones y en `#C72B0E`.
9. En `Formacion.tsx`, llamar a `useMensajeAccion()`, convertir `enviarFormacion` para que guarde el resultado del `update`/`create` y, si es `true`, llame a `mostrarMensaje('Formación actualizada')` o `mostrarMensaje('Formación creada')`; añadir `eliminarFormacion(id)` que haga `if (await deleteFormacion(id)) mostrarMensaje('Formación eliminada')` y usarlo en la prop `deleteFormacion` de la card; pasar `mensaje` al form. Prueba: crear, editar y eliminar en `/formacion` muestra los tres textos.
10. Repetir el paso 9 en `FormacionComplementaria.tsx`, `Conocimiento.tsx` y `Experiencia.tsx` con los textos de la tabla. Prueba: las tres páginas muestran sus seis mensajes (crear/actualizar/eliminar).
11. En `Perfil.tsx`, envolver `guardarPerfil` en un handler `enviarPerfil(payload)` que capture `const esNuevo = !perfil?.id` antes de la llamada y muestre `Perfil creado` o `Perfil actualizado` si el resultado es `true`; pasar `mensaje` a `PerfilForm`. Prueba: con perfil ya existente sale `Perfil actualizado`; con la colección vacía, `Perfil creado`.
12. Revisión final: `npx tsc --noEmit` sin errores y `/curriculum` sin cambios visuales ni de comportamiento.

## Criterios de aceptación

- [ ] Tras crear un registro con éxito en `/formacion`, `/formacion-complementaria`, `/conocimiento`, `/experiencia` o `/perfil`, aparece el texto de la tabla a la derecha de los botones del formulario.
- [ ] Tras actualizar un registro con éxito en esas cinco páginas, aparece el texto correspondiente con el participio en `actualizada`/`actualizado`.
- [ ] Tras eliminar un registro desde una card en las cuatro páginas con cards, aparece el texto con `eliminada`/`eliminado`.
- [ ] El mensaje se renderiza dentro de `<div className={styles.actions}>` del formulario, después de los botones, y **no** dentro de ninguna card.
- [ ] El color del texto es exactamente `#C72B0E`.
- [ ] Desde la primera letra hasta el texto completo transcurre ~1 s; el texto completo permanece ~3 s; desde el inicio del borrado hasta que no queda texto transcurre ~1 s.
- [ ] La salida borra letras desde el final hacia el principio (`Formación creada` → `Formación cre` → `Formaci` → `` ).
- [ ] La duración de cada fase es la misma para `Perfil creado` que para `Formación Complementaria actualizada`, pese a la diferencia de longitud.
- [ ] Si la llamada al backend falla (backend apagado), no aparece ningún mensaje y el error se sigue viendo en la consola.
- [ ] Repetir la misma acción dos veces seguidas relanza la animación desde cero, con el mismo texto.
- [ ] Lanzar una acción mientras la animación está en curso la cancela y arranca la nueva desde la primera letra.
- [ ] Navegar a otra página mientras la animación está en curso no produce warnings de actualización de estado sobre un componente desmontado.
- [ ] `/curriculum` no muestra ningún mensaje ni cambia respecto a antes de esta spec.
- [ ] `npx tsc --noEmit` no devuelve errores nuevos.

## Decisiones tomadas y descartadas

- **Componente + hook reutilizables** en lugar de duplicar la animación en cada formulario: son cinco formularios con el mismo comportamiento; duplicar cinco veces un `useEffect` con tres temporizadores es la vía rápida a que se desincronicen.
- **El estado del mensaje vive en la página, no en el formulario.** El borrado se dispara desde la card, que es hermana del formulario; el único ancestro común es la página. Descartado gestionar crear/actualizar dentro del form y pasarle una señal aparte para el borrado, porque serían dos mecanismos para lo mismo.
- **Los stores devuelven `boolean`.** Hoy capturan el error, hacen `console.error` y devuelven `undefined`, así que el llamante no puede distinguir éxito de fallo. Descartado relanzar el error con `throw`: obligaría a envolver en `try/catch` todos los handlers y cambiaría el `limpiarFormulario()` que hoy se ejecuta siempre. Devolver `boolean` no rompe a ningún llamante actual, que simplemente ignora el retorno.
- **Animación en JS con `slice` progresivo** en vez de CSS `steps()` sobre `width`: `steps()` solo queda bien con fuente monoespaciada y no permite controlar la fase de salida por separado.
- **El paso entre letras se calcula como `1000 / longitud`**, no un intervalo fijo: así `Perfil creado` y `Formación Complementaria actualizada` tardan lo mismo, que es lo que pide el requisito de "1 seg".
- **La salida borra desde el final**, que es literalmente "al revés de como apareció".
- **`id` incremental en el mensaje** en lugar de guardar solo el `string`: sin él, dos acciones seguidas con el mismo texto no relanzarían la animación.
- **Sin mensajes de error en la interfaz:** se mantiene el criterio de las SPEC 03 a 07, que dejan los errores en `console.error`.
- **No se cambia `limpiarFormulario()` para que solo limpie en caso de éxito**, aunque ahora habría información para hacerlo: es un cambio de comportamiento independiente y merece su propia spec.

## Riesgos identificados

- **Temporizadores huérfanos.** Tres temporizadores encadenados dentro de un `useEffect`: si la limpieza no los cancela todos, navegar entre páginas deja `setState` sobre componentes desmontados. Mitigación: guardar las tres referencias y cancelarlas en el `return` del efecto, y comprobarlo en el criterio de aceptación de navegación.
- **Salto de layout.** El `span` crece de 0 a ~40 caracteres dentro de un contenedor `flex`. Si el bloque `.actions` quedara estrecho, el texto podría empujar los botones. Mitigación: `white-space: nowrap` y comprobar visualmente en la página del texto más largo (`Formación Complementaria actualizada`).
- **Cinco hooks a modificar del mismo modo.** Olvidar un `return true` deja esa acción sin mensaje sin que TypeScript se queje, porque el tipo inferido pasaría a ser `boolean | undefined`. Mitigación: recorrer las tres funciones de cada hook y validar con el checklist de aceptación acción por acción.
