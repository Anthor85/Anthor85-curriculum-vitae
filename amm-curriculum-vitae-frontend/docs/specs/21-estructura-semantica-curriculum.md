# SPEC 21 — Estructura semántica de la página pública del currículum

> **Estado:** Implementada
> **Depende de:** SPEC 09 (`09-curriculum-pestanas-y-contacto.md`), que fija `Tabs` y `Contacto`; SPEC 15 (`15-expandable.md`), que fija `Expandable`; SPEC 20 (`20-prioridad-conocimiento-frontend.md`, Implementada), cuyo test de orden de `Conocimientos` se adapta
> **Fecha:** 2026-10-22
> **Objetivo:** Dar a la página `/` una jerarquía semántica correcta (nombre en `<h1>`, secciones en `<h2>`, ítems en `<h3>`, conocimientos como lista, landmarks `<main>` y `<header>`) sin ningún cambio visual.

## Situación de partida

Comprobado en `main` (commit `37840b0`); `CAMBIOS_Y_MEJORAS.md` §3.1 sigue pendiente:

- `Curriculum.tsx`: el nombre es un `<span>` dentro de `div.name` dentro de `div.header`; todo va en `div#mainPage`. No hay `<h1>` ni landmarks en `/` (`RutaPrivada` sí usa `<header>`/`<main>`, pero solo en rutas privadas).
- Las secciones son pestañas (`Tabs`): el título solo existe como texto del `role="tab"`; los `role="tabpanel"` no tienen encabezado.
- `ExperienciaItem`, `FormacionItem`, `FormacionComplementariaItem` y `ConocimientoItem` pintan el título en `<h2 className={styles.titulo}>`. Las ~41 tecnologías de la pestaña `Conocimientos` son `<div>` + `<h2>` sueltos dentro de `div.conocimientos` (grid).
- `ExperienciaItem` pasa su cabecera (`div.cabecera` con `h2.titulo`, `p.descripcion`, `span.fechas`) a `Expandable`, que la mete **dentro de un `<button>`**: HTML inválido (un `<button>` solo admite contenido de frase) y el rol de encabezado se pierde.
- `Contacto` pinta `<h3>Idiomas</h3>` en la columna lateral; `Curriculum.module.scss` lo estiliza con el selector `.contacto__idiomas h3`.
- `Curriculum.module.scss` estiliza el nombre con `.name span`.

## Alcance

**Dentro:**

- **Landmarks en `Curriculum`**: `div#mainPage` pasa a `<main id="mainPage">`; `div.header` pasa a `<header>`. Sin `<footer>`.
- **Nombre**: el `<span>` de `div.name` pasa a `<h1>`. El selector `.name span` pasa a `.name h1` y añade el reset necesario (`margin: 0`, `font: inherit`) para que se vea igual.
- **Secciones (`Tabs`)**: cada `role="tabpanel"` lleva como primer hijo un `<h2>` con `tab.titulo`, visualmente oculto (clase `tituloPanel` en `Tabs.module.scss` con el patrón *sr-only*: `position: absolute`, `width/height: 1px`, `overflow: hidden`, `clip-path: inset(50%)`, `white-space: nowrap`, `margin: -1px`, `padding: 0`, `border: 0`). Los paneles ocultos (`hidden`) quedan fuera del árbol de accesibilidad como hoy.
- **Ítems a `<h3>`**: `FormacionItem` y `FormacionComplementariaItem` cambian `<h2 className={styles.titulo}>` por `<h3 className={styles.titulo}>`.
- **`Expandable`**: nueva prop opcional `encabezado?: 'h2' | 'h3' | 'h4'`.
  - Si se pasa y no está `desactivado`: el `<button>` se envuelve en ese elemento (patrón acordeón WAI-ARIA: `<h3><button aria-expanded>…</button></h3>`), con clase `styles.encabezado` (`margin: 0`, `font: inherit`) para no alterar el aspecto.
  - Si se pasa y está `desactivado`: la `cabecera` se envuelve en ese elemento con la misma clase.
  - Sin la prop, comportamiento idéntico al actual.
- **`ExperienciaItem`**: pasa `encabezado="h3"` a `Expandable`; la cabecera usa solo contenido de frase: `div.cabecera` → `span.cabecera`, `h2.titulo` → `span.titulo`, `p.descripcion` → `span.descripcion` (mismas clases; ya son ítems de grid, así que se comportan como bloque).
- **Conocimientos como lista**: `div.conocimientos` pasa a `<ul className={styles.conocimientos}>` con `list-style: none; margin: 0; padding: 0` añadidos al estilo existente; `ConocimientoItem` pasa a `<li className={styles.Item}>` con `<span className={styles.titulo}>` (sin encabezado).
- **Idiomas**: `<h3>Idiomas</h3>` pasa a `<h2>`; el selector `.contacto__idiomas h3` pasa a `h2` con los mismos valores.
- **Estilos**: ningún cambio visual en escritorio ni en móvil (≤ 768 px y ≤ 600 px). Todo cambio de etiqueta va acompañado del reset o del cambio de selector que lo garantice.
- **Tests** (Vitest): se adaptan los existentes y se añaden los del plan.
- **`CAMBIOS_Y_MEJORAS.md`**: §3.1 se marca como hecho con la convención del documento (tachado + `Hecho: …`).

**Fuera de alcance (para futuras specs):**

- `<footer>` con fecha de actualización y enlace al repo (§ "Sin pie de página" de `CAMBIOS_Y_MEJORAS.md`).
- JSON-LD, canonical, metadatos Twitter (§3.2), sitemap/404 (§3.3).
- Páginas privadas, `Login`, `ErrorBoundary`, cards y formularios de administración.
- `CurriculumPDF` (react-pdf, no genera HTML).
- `Resumen` y el bloque de contacto/redes: sin encabezados nuevos.
- Cambiar el comportamiento de teclado de `Tabs` o del menú móvil.

## Modelo de datos

No introduce datos nuevos. Único cambio de API de componente:

```ts
interface ExpandableProps {
  cabecera: ReactNode;
  inicialAbierto?: boolean;
  desactivado?: boolean;
  // Envuelve el botón (o la cabecera si está desactivado) en un encabezado
  encabezado?: 'h2' | 'h3' | 'h4';
  children: ReactNode;
}
```

Jerarquía resultante de `/`:

```
<header>  h1  Nombre Apellidos
<main id="mainPage">
  h2  Idiomas                       (columna lateral, si hay idiomas)
  tabpanel  h2 (oculto) Experiencia
              h3 > button  Empresa · descripción · fechas
  tabpanel  h2 (oculto) Formación Académica
              h3  Título
  tabpanel  h2 (oculto) Formación Complementaria
              h3  Título
  tabpanel  h2 (oculto) Conocimientos
              ul > li  Tecnología
```

> El `<header>` queda dentro de `<main>` porque hoy `div.header` es hijo de `div#mainPage` (posicionado `absolute` respecto a él). Ver "Decisiones".

## Plan de implementación

1. **`Expandable` + test**: añadir la prop `encabezado` y la clase `.encabezado` en `Expandable.module.scss`. Tests en `Expandable.test.tsx`: sin prop no hay heading; con `encabezado="h3"` existe `heading` de nivel 3 que contiene el `button` con `aria-expanded`; con `desactivado` el heading envuelve la cabecera y no hay `button`. Sistema funcional: nadie usa la prop todavía.
2. **`ExperienciaItem`**: pasar `encabezado="h3"` y cambiar `div/h2/p` de la cabecera a `span`. Comprobar visualmente la tarjeta de experiencia (escritorio y ≤ 600 px).
3. **`FormacionItem` y `FormacionComplementariaItem`**: `h2` → `h3`.
4. **Conocimientos**: `div.conocimientos` → `ul` con reset de lista; `ConocimientoItem` → `li` + `span.titulo`. Adaptar el test de SPEC 20 en `Curriculum.test.tsx` (`getAllByRole('heading')` → `getAllByRole('listitem')`).
5. **`Tabs`**: `<h2 className={styles.tituloPanel}>` como primer hijo de cada panel + estilo *sr-only*. Test en `Tabs.test.tsx`: el panel activo tiene un `heading` de nivel 2 con el título de la pestaña.
6. **`Contacto`**: `h3` → `h2` en Idiomas y selector en `Curriculum.module.scss`. Test en `Contacto.test.tsx`: `getByRole('heading', { level: 2, name: 'Idiomas' })`.
7. **`Curriculum`**: `div#mainPage` → `main`, `div.header` → `header`, `span` → `h1`; selector `.name h1` con reset. Tests en `Curriculum.test.tsx`: un único `heading` de nivel 1 con nombre y apellidos; existe `main`; existe un `<header>` (buscado por etiqueta, ver Riesgos); la pestaña Experiencia expone `heading` nivel 3 con el nombre de la empresa.
8. **Verificación visual** con `npm run dev`: comparar `/` con `main` en escritorio (≥ 1080 px), ≤ 768 px y ≤ 600 px — nombre, columna lateral, Idiomas, las cuatro pestañas, tarjeta de experiencia plegada y desplegada, grid de conocimientos.
9. **`CAMBIOS_Y_MEJORAS.md`**: marcar §3.1 como hecho.
10. `npm run lint`, `npm test` y `npm run build` (incluye prerender) en verde.

## Criterios de aceptación

- [ ] En `/` hay exactamente un `<h1>` y contiene `nombre apellidos` del perfil.
- [ ] `/` tiene un `<main>` y un `<header>`; no hay `<main>` anidados.
- [ ] Cada `role="tabpanel"` tiene como primer hijo un `<h2>` con el título de su pestaña, invisible en pantalla.
- [ ] Los títulos de experiencia, formación y formación complementaria son `<h3>`; en experiencia el `<h3>` contiene el `<button aria-expanded>` y el botón no contiene elementos de bloque ni encabezados.
- [ ] La pestaña `Conocimientos` es un `<ul>` con un `<li>` por conocimiento y sin encabezados dentro de la lista; el orden de SPEC 20 se mantiene.
- [ ] `Idiomas` es un `<h2>`.
- [ ] No queda ningún `<h2>` como título de ítem en `src/pages/components/curriculum/items/`.
- [ ] `Expandable` sin la prop `encabezado` genera el mismo DOM que antes.
- [ ] Comparación visual con `main` en escritorio, ≤ 768 px y ≤ 600 px sin diferencias apreciables (tamaños, márgenes, grid, bullets, foco visible del botón de experiencia).
- [ ] El HTML prerenderizado (`npm run build`) contiene el `<h1>` y el `<main>`.
- [ ] §3.1 de `CAMBIOS_Y_MEJORAS.md` marcado como hecho.
- [ ] `npm run lint`, `npm test` y `npm run build` sin errores.

## Decisiones tomadas y descartadas

- **`<h2>` de sección oculto en cada panel** (tomada) frente a no poner `<h2>` (salto h1→h3) o un `<h2>` visible (cambia el diseño). Las pestañas siguen siendo el título visual.
- **Patrón acordeón `h3 > button`** en `Expandable` (tomada) frente a sacar el título fuera del botón (más reestructuración de layout) o dejar el encabezado dentro del botón (sigue siendo inválido). Consecuencia aceptada: el nombre accesible del `<h3>` incluye empresa, descripción y fechas.
- **`encabezado` como prop opcional** de `Expandable`, no fija: mantiene el componente genérico y el resto de usos intactos.
- **Idiomas como `<h2>`** (tomada) frente a dejar `<h3>`: evita el salto h1→h3 en la columna lateral, mismo estilo.
- **Landmarks `main` + `header`** (tomada) frente a solo `main` o añadir `<section>` por panel (redundante con `role="tabpanel"`). Sin `<footer>`: no hay contenido.
- **`<header>` dentro de `<main>`**: se mantiene la estructura DOM actual porque `.header` se posiciona `absolute` respecto a `.MainPage`; sacarlo obligaría a rehacer el layout. Un `<header>` dentro de `<main>` no es `banner`, pero la jerarquía de encabezados (objetivo principal) queda correcta.
- **Estilo *sr-only* local en `Tabs.module.scss`** frente a una clase global en `styles.css`: el proyecto usa CSS Modules y hoy no hay otro uso.
- **Conocimientos sin encabezado** (`li > span`): 41 encabezados para palabras sueltas eran ruido para lectores de pantalla.

## Riesgos identificados

- **Estilos por defecto del navegador** en `h1`/`h2`/`h3`/`ul`/`li` (márgenes, tamaño, negrita, bullets) pueden alterar el aspecto. Mitigación: resets explícitos en cada cambio y verificación visual del paso 8.
- **El `<h2>` oculto dentro de un panel con `display: flex; gap` y `overflow-y: auto`**: al ser `position: absolute` no participa en el `gap`, pero puede generar scroll si no se recorta. Mitigación: `clip-path` + `overflow: hidden` + `margin: -1px`; comprobar que no aparece scroll nuevo.
- **`banner` vs `header` en tests**: un `<header>` dentro de `<main>` no expone rol `banner`; los tests deben buscarlo por etiqueta (`container.querySelector('header')`), no por rol.
- **Tests que cuentan encabezados** (`Curriculum.test.tsx` de SPEC 20) cambian de resultado al añadir el `<h2>` oculto y quitar los de conocimientos; se adaptan en el paso 4.
