# SPEC 15 — Componente Expandable

> **Estado:** Implementado
> **Depende de:** SPEC 13 (`13-tests-componentes-vitest.md`, Implementada), que fija el patrón de `test/components/*.test.tsx`
> **Fecha:** 2026-09-03
> **Objetivo:** Crear `src/components/Expandable.tsx`, un contenedor plegable con cabecera clicable y triángulo indicador que rota 180º, y usarlo en `ExperienciaItem` tanto para la tarjeta completa como para los bloques internos de tecnologías e hitos.

## Alcance

**Dentro:**

- Componente nuevo `src/components/Expandable.tsx` con su `src/components/Expandable.module.scss`.
- Props: `cabecera: ReactNode` (obligatoria) e `inicialAbierto?: boolean` (por defecto `false`); el contenido plegable se pasa como `children`.
- Estado local (`useState`) que controla si está desplegado. Cambia al pulsar la cabecera.
- La cabecera se envuelve en `<button type="button" aria-expanded={abierto}>`, con el `ReactNode` de `cabecera` y, a su derecha, un triángulo (`<span>` con el truco CSS de `border`) que apunta abajo colapsado y arriba desplegado, mediante `transform: rotate(180deg)` en sentido horario con `transition`.
- El contenido (`children`) solo se pinta en el DOM cuando `abierto === true` (renderizado condicional, no `display: none`).
- `test/components/Expandable.test.tsx` con los 5 casos descritos en "Modelo de datos".
- Refactor de `src/pages/curriculum/ExperienciaItem.tsx`:
  - El `<h2 className={styles.titulo}>{experiencia.empresa}</h2>` pasa a ser la `cabecera` de un `Expandable` que envuelve todo el resto de la tarjeta (fechas, descripción, y los dos Expandables internos de tecnologías e hitos).
  - El bloque de tecnologías usa un `Expandable` propio con `<p className={styles.etiqueta}>Tecnologías:</p>` como cabecera y el `<ul>` existente como contenido. Se sigue renderizando solo si `tecnologias.length > 0`.
  - El bloque de hitos usa un `Expandable` propio con `<p className={styles.etiqueta}>Hitos:</p>` como cabecera y el `<ul>` existente como contenido. Se sigue renderizando solo si `experiencia.hitos?.length`.
  - Los tres Expandables arrancan colapsados (sin pasar `inicialAbierto`, o `inicialAbierto={false}` explícito).
- Estilos nuevos en `Expandable.module.scss` para el botón de cabecera (sin estilos de botón nativo: `background: none; border: none; padding: 0`, cursor pointer, `display: flex; justify-content: space-between; align-items: center; width: 100%`) y el triángulo.
- `src/components/Expandable.tsx` añadido al `coverage.include` de `vite.config.js`, sujeto al umbral global del 80%.

**Fuera de alcance (para futuras specs):**

- Animación de altura (slide down/up) al desplegar/colapsar. El cambio es instantáneo salvo la rotación del triángulo, que sí lleva `transition`.
- Persistir el estado abierto/cerrado entre sesiones o navegaciones (`localStorage`, query params, etc.).
- Permitir varias cabeceras controladas desde fuera (`abierto`/`onToggle` como props controladas). El estado es siempre interno al componente.
- Anidar más de dos niveles de Expandable o generalizar su uso a otras páginas (`ExperienciaCard`, `Conocimiento`, etc.) más allá de `ExperienciaItem`.
- Accesibilidad más allá de `aria-expanded` en el `button` (por ejemplo `aria-controls` con id generado, o roles ARIA de "region" en el contenido).
- Rediseño visual de `ExperienciaItem` más allá de envolver el título y los dos bloques existentes en Expandable.

## Modelo de datos

### `src/components/Expandable.tsx`

```tsx
interface ExpandableProps {
  cabecera: ReactNode;
  inicialAbierto?: boolean;
  children: ReactNode;
}
```

No se introduce ninguna interfaz en `src/interfaces/`; sigue el mismo patrón que `Button.tsx`, con las props definidas inline en el propio componente.

### Casos de `test/components/Expandable.test.tsx` (5 tests)

1. Pinta la `cabecera` recibida y, colapsado por defecto, no pinta el `children` en el DOM.
2. Al pulsar el botón de la cabecera, el `children` se pinta y `aria-expanded` del botón pasa a `"true"`.
3. Un segundo click sobre la cabecera vuelve a colapsar: el `children` desaparece del DOM y `aria-expanded` vuelve a `"false"`.
4. Con `inicialAbierto={true}`, el `children` se pinta desde el primer render y `aria-expanded` es `"true"` sin necesidad de click.
5. El triángulo tiene una clase que refleja el estado (por ejemplo `styles.abierto` aplicada solo cuando `abierto === true`), comprobado consultando la clase del elemento, no un valor de CSS computado.

## Plan de implementación

1. Crear `src/components/Expandable.tsx` con el estado local, el `button` de cabecera con `aria-expanded`, el triángulo y el renderizado condicional del `children`. Comprobación: se puede importar y montar en cualquier página sin errores de tipos.
2. Crear `src/components/Expandable.module.scss` con los estilos del botón de cabecera y el triángulo (CSS con `border` para el triángulo, `transform: rotate(180deg)` y `transition` cuando lleva la clase de abierto). Comprobación manual: montado suelto en una página, el triángulo apunta abajo colapsado y arriba tras el click, con una rotación suave.
3. Escribir `test/components/Expandable.test.tsx` con los 5 casos. Comprobación: `npm test -- Expandable` en verde.
4. Añadir `src/components/Expandable.tsx` al `coverage.include` de `vite.config.js`. Comprobación: `npm run test:coverage` sigue en verde con el umbral global del 80%.
5. Refactorizar `src/pages/curriculum/ExperienciaItem.tsx`: envolver el título en un `Expandable` con el resto del contenido de la tarjeta como `children`, y convertir los bloques de tecnologías e hitos en sendos `Expandable` internos con su `<p className={styles.etiqueta}>` como cabecera. Comprobación manual: `/experiencia` pinta las tarjetas colapsadas, cada una se despliega al pulsar el nombre de la empresa, y dentro tecnologías e hitos se despliegan por separado.
6. Ajustar `Curriculum.module.scss` si algún estilo existente (por ejemplo `.titulo`, `.etiqueta`) necesita retocarse para convivir con el `button` de cabecera de Expandable (p. ej. quitar `margin` que ya no aplica al envolverse en el botón). Comprobación: visual, sin regresiones en el resto de `ExperienciaItem`.
7. `npm test`, `npm run lint` y `npm run build` sin errores nuevos.

## Criterios de aceptación

- [ ] `src/components/Expandable.tsx` existe, recibe `cabecera`, `inicialAbierto` (opcional) y `children`, y arranca colapsado salvo que `inicialAbierto` sea `true`.
- [ ] Pulsar la cabecera alterna el estado desplegado/colapsado; el contenido solo está en el DOM cuando está desplegado.
- [ ] El triángulo apunta hacia abajo colapsado y hacia arriba desplegado, con una rotación de 180º por CSS en sentido horario y transición suave.
- [ ] El botón de cabecera tiene `aria-expanded` reflejando el estado actual.
- [ ] `test/components/Expandable.test.tsx` existe con los 5 casos descritos, cada uno en su propio `it`, y pasa.
- [ ] `src/pages/curriculum/ExperienciaItem.tsx` usa `Expandable` con `<h2 className={styles.titulo}>{experiencia.empresa}</h2>` como cabecera, envolviendo fechas, descripción, tecnologías e hitos.
- [ ] Dentro de esa tarjeta, tecnologías e hitos son cada uno un `Expandable` independiente con su etiqueta (`Tecnologías:` / `Hitos:`) como cabecera.
- [ ] Los tres Expandables de `ExperienciaItem` arrancan colapsados.
- [ ] El comportamiento condicional existente se mantiene: el bloque de tecnologías no se pinta si no hay tecnologías, y el de hitos no se pinta si no hay hitos.
- [ ] `src/components/Expandable.tsx` está en el `coverage.include` de `vite.config.js` y `npm run test:coverage` termina en verde con el umbral global del 80%, sin umbrales propios nuevos.
- [ ] `npm test`, `npm run lint` y `npm run build` terminan sin errores nuevos.

## Decisiones tomadas y descartadas

- **Sí:** `cabecera` como prop y el contenido plegable como `children`, en vez de dos props (`cabecera` y `contenido`). Es el patrón más idiomático en React y evita una prop redundante cuando ya existe `children`.
- **Sí:** `inicialAbierto` opcional (por defecto `false`) en vez de que el componente arranque siempre cerrado sin posibilidad de configurarlo. Da flexibilidad para futuros usos sin añadir complejidad ahora, y las tres instancias de esta spec la dejan en `false`.
- **Sí:** cabecera envuelta en `<button aria-expanded>` en vez de un `<div onClick>`. Da accesibilidad de teclado y foco gratis, y `aria-expanded` es el enganche natural para los tests, sin depender de clases CSS internas.
- **Sí:** triángulo dibujado con el truco CSS de `border` en vez de un carácter unicode o un icono de fuente. No depende de la fuente del sistema ni de un icon-font externo, y es coherente con no haber añadido dependencias de iconos en el proyecto hasta ahora.
- **Sí:** renderizado condicional del `children` (no se pinta en el DOM si está colapsado) en vez de ocultarlo con `display: none`. Es más barato para el DOM y coincide con cómo ya se comprueban otros estados en los tests existentes del proyecto (aparece/desaparece del árbol).
- **No:** animación de altura al desplegar. El enunciado solo pide la rotación del triángulo; añadir una transición de `max-height` o `grid-template-rows` es una mejora visual aparte que puede ir en otra spec si se pide.
- **Sí:** el Expandable principal de `ExperienciaItem` engloba tecnologías e hitos como contenido (colapsar la tarjeta oculta todo). Es el comportamiento que se espera de una tarjeta con cabecera plegable: todo su contenido depende de si la tarjeta está abierta.
- **No:** interfaz separada en `src/interfaces/` para las props de Expandable. Se sigue el patrón de `Button.tsx`, que define sus props inline en el propio archivo del componente.
- **Sí:** un único archivo de test nuevo (`Expandable.test.tsx`), siguiendo el patrón de `Button.test.tsx` de la SPEC 13. No se testea `ExperienciaItem` de forma aislada en esta spec.

## Riesgos identificados

| Riesgo                                                                                                                                                           | Mitigación                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Anidar Expandable dentro de Expandable (tecnologías/hitos dentro de la tarjeta) hace que un click dentro del contenido interno se propague y colapse el exterior | Cada Expandable tiene su propio `button` de cabecera; el click en el contenido interno no toca el `button` exterior, así que no hay propagación de evento a un `onClick` ajeno |
| Cambiar `<h2>` de estar suelto a estar dentro de un `<button>` puede romper estilos existentes (`.titulo` con `margin: 0`, tipografía)                           | El paso 6 del plan revisa `Curriculum.module.scss` explícitamente antes de dar la spec por completa                                                                            |
| Alcanzar el 80% de cobertura en `Expandable.tsx` sin cubrir la rama `inicialAbierto`                                                                             | Es el caso 4 de los tests, escrito explícitamente para esa rama                                                                                                                |
| El truco CSS del triángulo con `border` requiere anchura/altura 0 y puede desalinearse verticalmente respecto al texto de la cabecera                            | El botón de cabecera usa `display: flex; align-items: center`, que centra el triángulo respecto al texto sin depender de ajustes manuales                                      |
