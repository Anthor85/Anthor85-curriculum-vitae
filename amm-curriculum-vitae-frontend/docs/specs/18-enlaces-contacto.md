# SPEC 18 — Enlaces de contacto, LinkedIn y GitHub, y retirada de `fechaNacimiento`

> **Estado:** Aprobada
> **Depende de:** SPEC 10 del backend (`../amm-curriculum-vitae-backend/docs/specs/10-perfil-linkedin-github.md`, Borrador), que aporta `linkedinURL` y `githubURL` en la API y retira `fechaNacimiento`; SPEC 07 (`07-editar-perfil-frontend.md`), que fija `PerfilForm` y `PerfilPayload`; SPEC 09 (`09-curriculum-pestanas-y-contacto.md`), que creó `Contacto`; SPEC 11 (`11-vista-movil.md`), que fija la cabecera en móvil
> **Fecha:** 2026-10-09
> **Objetivo:** Que el formulario de `/perfil` edite `linkedinURL` y `githubURL` y deje de pedir `fechaNacimiento`, y que el bloque de contacto de la página principal convierta dirección, teléfono y email en enlaces (Maps, `tel:`, `mailto:`) y añada debajo dos líneas enlazadas a LinkedIn y GitHub con sus iconos.

## Situación de partida

- `Contacto.tsx` pinta tres líneas (dirección, teléfono, email) como `<span>`. La página pública no tiene ningún `<a>`.
- `Contacto` recibe `styles` por prop y lo usan `Curriculum.tsx` (web) y `CurriculumPDF.tsx` (PDF, que es una captura de `html2canvas`).
- `public/icons/github.svg` y `public/icons/linkedin.svg` ya están en el repositorio; `IconName` de `helpers/getIcons.ts` no los incluye.
- `PerfilForm` maneja ocho campos; `foto` es el único opcional.
- `fechaNacimiento` se pide en el formulario como obligatorio y no se pinta en ninguna vista.

## Alcance

**Dentro:**

- **Retirada de `fechaNacimiento`**: se elimina de `Perfil` (y con ello de `PerfilPayload`), de `PERFIL_VACIO`, de la precarga de `PerfilForm` (el `.slice(0, 10)`) y su `<input type="date">` con la etiqueta `Fecha de Nacimiento:`. El payload deja de enviarlo. El formulario queda con nueve campos.
- **Interfaz `Perfil`**: `linkedinURL?: string` y `githubURL?: string`. En `PerfilPayload` son `string` obligatorios (`''` cuando no hay valor), igual que `foto`.
- **`PerfilForm`**: dos campos nuevos tras `Foto`, con etiquetas `LinkedIn:` y `GitHub:`, `type="url"`, sin `required`. Se precargan con `perfil.linkedinURL ?? ''` / `perfil.githubURL ?? ''`, se recortan con `trim()` al enviar y entran en `PERFIL_VACIO`.
- **Helper `src/helpers/enlacesContacto.ts`** con tres funciones puras:
  - `enlaceMaps(direccion)`: `https://www.google.com/maps/search/?api=1&query=` + `encodeURIComponent(direccion)`.
  - `enlaceTelefono(telefono)`: `tel:` + el teléfono sin espacios, guiones, puntos ni paréntesis; conserva un `+` inicial. No añade prefijo de país.
  - `enlaceEmail(email)`: `mailto:` + email.
- **`Contacto.tsx`**:
  - Cada `div.contacto__linea` pasa a ser un `<a className={styles.contacto__linea}>` que envuelve icono y texto.
  - Dirección → `enlaceMaps`; teléfono → `enlaceTelefono`; email → `enlaceEmail`. El texto visible no cambia.
  - Debajo, en este orden, línea `LinkedIn` (icono `linkedin`, `href={perfil.linkedinURL}`) y línea `GitHub` (icono `github`, `href={perfil.githubURL}`). Texto visible fijo: `LinkedIn` y `GitHub`. Cada línea solo se pinta si su campo tiene valor.
  - Maps, LinkedIn y GitHub abren en pestaña nueva (`target="_blank"` y `rel="noopener noreferrer"`); `tel:` y `mailto:` no llevan `target`.
  - Los iconos siguen con `alt=""`.
- **`helpers/getIcons.ts`**: `IconName` admite `'github'` y `'linkedin'`.
- **Estilos**, en `Curriculum.module.scss` y `CurriculumPDF.module.scss`: el `a.contacto__linea` hereda el color gris actual y no lleva subrayado. Solo en `Curriculum.module.scss`: subrayado del texto en `:hover` y `:focus-visible`. Sin clases de layout nuevas: son dos líneas más en la misma columna, también en móvil.
- **PDF**: las dos líneas nuevas aparecen como texto con su icono. Los enlaces no son pulsables (es una imagen).
- **Tests**:
  - `test/helpers/enlacesContacto.test.tsx`, nuevo.
  - `test/components/Contacto.test.tsx`, nuevo.
  - `test/pages/Perfil.test.tsx`: fixture y payloads esperados con los dos campos y sin `fechaNacimiento`; casos de precarga, `trim` y envío vacío; se eliminan las aserciones y el `escribirFecha` sobre `Fecha de Nacimiento:` y se comprueba que esa etiqueta no existe.

**Fuera de alcance (para futuras specs):**

- PDF con texto real y enlaces pulsables: el usuario lo abordará en una spec propia que cambia la generación del PDF.
- Mostrar la URL (completa o acortada) como texto de LinkedIn y GitHub.
- Campo `web` u otras redes.
- Campo `mapsURL` con una URL exacta de Maps.
- Validar en cliente el dominio de las URLs o el formato de teléfono y email.
- Mostrar en el formulario el motivo de un `500` del backend más allá del `MensajeAccion` actual.
- Migrar inputs o botones de los formularios a componentes nuevos.
- Cambios en el prerender (SPEC 17): `Contacto` ya forma parte del HTML prerenderizado y los enlaces salen sin tocar nada.
- Tipar `curriculum.interface.ts`.

## Modelo de datos

No hay persistencia nueva en el frontend.

```ts
export interface Perfil {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  descripcion: string;
  foto?: string;
  linkedinURL?: string;
  githubURL?: string;
}

export interface PerfilPayload extends Omit<Perfil, 'id'> {
  foto: string;
  linkedinURL: string;
  githubURL: string;
}
```

```ts
export type IconName =
  | 'sobre'
  | 'chincheta'
  | 'telefono'
  | 'descarga'
  | 'spinner-arc'
  | 'github'
  | 'linkedin';
```

Líneas de `Contacto`, en orden:

| Línea     | Icono       | Texto visible      | `href`                         | Pestaña nueva | Se pinta si          |
| --------- | ----------- | ------------------ | ------------------------------ | ------------- | -------------------- |
| Dirección | `chincheta` | `perfil.direccion` | `enlaceMaps(direccion)`        | sí            | siempre              |
| Teléfono  | `telefono`  | `perfil.telefono`  | `enlaceTelefono(telefono)`     | no            | siempre              |
| Email     | `sobre`     | `perfil.email`     | `enlaceEmail(email)`           | no            | siempre              |
| LinkedIn  | `linkedin`  | `LinkedIn`         | `perfil.linkedinURL`           | sí            | `perfil.linkedinURL` |
| GitHub    | `github`    | `GitHub`           | `perfil.githubURL`             | sí            | `perfil.githubURL`   |

**Ficheros**

| Fichero                                                    | Cambio                                             |
| ---------------------------------------------------------- | -------------------------------------------------- |
| `src/interfaces/perfil.interface.ts`                       | dos campos nuevos; fuera `fechaNacimiento`         |
| `src/pages/forms/PerfilForm.tsx`                           | dos inputs, `PERFIL_VACIO`, precarga y `trim`; fuera el input de fecha |
| `src/helpers/enlacesContacto.ts`                           | nuevo                                              |
| `src/helpers/getIcons.ts`                                  | `IconName` con `github` y `linkedin`               |
| `src/pages/components/curriculum/items/Contacto.tsx`       | líneas como `<a>` y dos líneas nuevas              |
| `src/pages/Curriculum.module.scss`                         | estilo de enlace en `.contacto__linea`             |
| `src/pages/components/curriculum/pdf/CurriculumPDF.module.scss` | estilo de enlace en `.contacto__linea`        |
| `public/icons/github.svg`, `public/icons/linkedin.svg`     | se commitean; se retoca el `viewBox` solo si el paso 5 lo pide |
| `test/helpers/enlacesContacto.test.tsx`                    | nuevo                                              |
| `test/components/Contacto.test.tsx`                        | nuevo                                              |
| `test/pages/Perfil.test.tsx`                               | fixture, payloads y casos nuevos                   |

## Plan de implementación

1. **Interfaz y formulario.** Quitar `fechaNacimiento` de `Perfil`, de `PERFIL_VACIO`, de la precarga y del JSX de `PerfilForm`. Añadir los campos nuevos a `Perfil` y `PerfilPayload`; en `PerfilForm`, `PERFIL_VACIO`, la precarga, el `trim` y los dos inputs `type="url"` tras `Foto`. Adaptar `test/pages/Perfil.test.tsx`. Comprobación: `npm run verify` en verde y ninguna referencia a `fechaNacimiento` en `src/`; con el backend de la SPEC 10, `/perfil` no muestra la fecha, guardar las dos URLs, recargar y verlas precargadas; vaciarlas y guardar las borra.
2. **Helper `enlacesContacto` y su test.** Casos: dirección con espacios, comas y tildes codificada; teléfono con espacios y con `+34`; email tal cual. Comprobación: `npm test` en verde.
3. **`IconName`.** Añadir `github` y `linkedin`. Comprobación: `/icons/github.svg` y `/icons/linkedin.svg` cargan con `npm run dev`.
4. **`Contacto.tsx` y estilos.** Líneas como `<a>`, dos líneas condicionales, regla de enlace en los dos `.module.scss`. Test nuevo `test/components/Contacto.test.tsx`: `href` de las cinco líneas, `target`/`rel` solo en las tres externas, líneas de LinkedIn y GitHub ausentes sin valor, sin perfil no se pinta nada. Comprobación: en `/` las cinco líneas se ven con el mismo color y tamaño que antes y cada una navega a su destino.
5. **Revisión visual en escritorio y móvil.** En escritorio y a 360 px y 414 px de ancho: los cinco iconos se ven del mismo tamaño y alineados, sin desbordamiento horizontal y sin que la cabecera se descoloque respecto a la foto y el botón de descarga. Si un icono nuevo se ve más pequeño que los otros (el `viewBox` de `linkedin.svg` trae margen lateral), se ajusta el `viewBox` del SVG.
6. **PDF.** Exportar el PDF. Comprobación: las cinco líneas aparecen con sus iconos, sin subrayado y con el color de antes; el resto del documento no cambia.
7. **Prerender.** `npm run build` con el backend levantado. Comprobación: `dist/index.html` contiene los `href` de `mailto:`, `tel:`, Maps, LinkedIn y GitHub y no contiene la cadena `fechaNacimiento`; `npm run preview` no muestra avisos de hidratación en `/`.
8. `npm run verify` y `npm run test:coverage` completos.

## Criterios de aceptación

- [ ] `/perfil` no muestra el campo `Fecha de Nacimiento:` y el payload enviado no incluye `fechaNacimiento`.
- [ ] No queda ninguna referencia a `fechaNacimiento` en `src/` ni en `test/`.
- [ ] Tras `npm run build` con el backend de la SPEC 10 ya limpio, `dist/index.html` no contiene `fechaNacimiento`.
- [ ] `/perfil` muestra los campos `LinkedIn:` y `GitHub:` tras `Foto`, precargados con los valores guardados o vacíos si no los hay.
- [ ] Se puede guardar el perfil con los dos campos vacíos.
- [ ] Un valor que no es una URL (`github.com/x`) bloquea el envío en el navegador y no lanza ninguna petición.
- [ ] El payload enviado incluye siempre `linkedinURL` y `githubURL`, recortados, con `''` cuando están vacíos.
- [ ] Vaciar un campo y guardar hace desaparecer su línea de la página principal.
- [ ] En `/`, la dirección enlaza a `https://www.google.com/maps/search/?api=1&query=…` con la dirección codificada y abre en pestaña nueva.
- [ ] El teléfono enlaza a `tel:` con el número sin espacios; el email enlaza a `mailto:` con la dirección. Ninguno de los dos lleva `target`.
- [ ] Con `linkedinURL` y `githubURL` guardados, bajo el email aparecen las líneas `LinkedIn` y `GitHub`, en ese orden, con su icono, `href` igual al valor guardado, `target="_blank"` y `rel="noopener noreferrer"`.
- [ ] Sin `linkedinURL` o sin `githubURL`, su línea no está en el DOM.
- [ ] En reposo, las líneas tienen el mismo color, tamaño y separación que antes; el subrayado solo aparece en `:hover` y `:focus-visible`.
- [ ] Las cinco líneas son alcanzables con el tabulador y muestran foco visible.
- [ ] A 360 px de ancho no hay scroll horizontal y las cinco líneas quedan en columna, alineadas por el icono.
- [ ] Los cinco iconos se ven del mismo tamaño en web y en PDF.
- [ ] El PDF exportado incluye las líneas de LinkedIn y GitHub como texto, sin subrayado.
- [ ] `dist/index.html` contiene los cinco enlaces tras `npm run build` y `/` hidrata sin avisos.
- [ ] `npm run verify` y `npm run test:coverage` terminan en verde con el umbral del 80%.

## Decisiones tomadas y descartadas

- **Sí:** retirar `fechaNacimiento` de interfaz y formulario. No se pinta en ninguna vista y viajaba en `window.__CURRICULUM__`. La retirada en la API y en la base es de la SPEC 10 del backend.
- **Sí:** dos specs, backend (SPEC 10) y frontend (esta), como en la edición de perfil (back 06 + front 07).
- **Sí:** campos opcionales; la línea se oculta si no hay valor.
- **Sí:** texto visible fijo `LinkedIn` / `GitHub`. Corto y sin saltos de línea en móvil. **No:** URL acortada o completa; que la dirección sea legible en papel se resuelve en la futura spec del PDF con enlaces.
- **Sí:** las dos líneas nuevas salen también en el PDF como texto. **No:** ocultarlas con una prop ni añadir anotaciones de enlace con jsPDF en esta spec.
- **Sí:** enlace de Maps como búsqueda de Google Maps construida desde `direccion`. **No:** campo `mapsURL` (más modelo y formulario) ni esquema `geo:` (no funciona en escritorio).
- **Sí:** `type="url"` en el formulario y validador `http(s)` en el modelo (SPEC 10 del backend). **No:** validar dominio.
- **Sí:** enlaces con el aspecto del texto actual y subrayado solo en hover/focus. **No:** color de marca ni subrayado permanente.
- **Sí:** una línea por enlace, cinco en columna. **No:** LinkedIn y GitHub en la misma fila.
- **Sí:** el `<a>` es la línea entera (icono + texto), para que el área pulsable en móvil no sea solo el texto.
- **Sí:** `target="_blank"` solo en los enlaces `https`; `tel:` y `mailto:` los gestiona el sistema.
- **Sí:** `enlaceTelefono` solo limpia separadores y no añade `+34`: el prefijo, si se quiere, se escribe en el campo.
- **Sí:** helper puro `enlacesContacto` con test propio, como `metasCurriculum` y `urlFoto`.
- **Sí:** los SVG de `public/icons` se usan tal como los ha aportado el usuario; solo se toca el `viewBox` si el tamaño aparente no cuadra.

## Riesgos identificados

| Riesgo                                                                                              | Mitigación                                                                                                             |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Desplegar el frontend antes que el backend: los campos nuevos se ignoran y, sin `fechaNacimiento`, el `required` del modelo antiguo responde `500` al guardar | Dependencia declarada; se despliega primero la SPEC 10 del backend, que ignora el campo si el frontend anterior aún lo envía |
| El build se lanza antes del `$unset` en producción y `fechaNacimiento` sigue en el HTML prerenderizado | Redesplegar el frontend después del paso 8 de la SPEC 10 del backend; criterio de aceptación propio                    |
| Los iconos nuevos se ven más pequeños o desalineados (`viewBox` con margen, `800px` de tamaño propio) | El CSS ya fija 18 px / 16 px; el paso 5 lo revisa y ajusta el `viewBox` si hace falta                                   |
| Estilos globales de `a` (color, subrayado) cambian el aspecto de las líneas en web o en el PDF       | Regla explícita de color heredado y sin subrayado en los dos `.module.scss`; pasos 4 y 6                                |
| `html2canvas` no pinta los SVG nuevos o pinta el subrayado de un estado hover                        | Paso 6; el módulo del PDF no define hover                                                                               |
| jsdom no aplica la validación de `type="url"` y el test de "URL inválida" no es fiable                | Ese criterio se verifica a mano en el navegador; los tests cubren precarga, `trim` y payload                            |
| El perfil ya prerenderizado no trae los enlaces hasta redesplegar                                    | La revalidación tras hidratar (SPEC 17) los pinta para las personas; redeploy manual tras rellenar los campos           |
| Área pulsable pequeña en móvil (líneas de ~20 px de alto)                                            | El enlace ocupa toda la línea; si en el paso 5 resulta incómodo, se anota para una spec de ajuste, no se cambia el espaciado aquí |
