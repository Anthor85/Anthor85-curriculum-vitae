# Cambios y mejoras — CV web de cara a reclutadores

Web revisada: https://antonio-macian-martinez-cv-delta.vercel.app/ (07/10/2026)

Revisión hecha sobre la web en producción (HTML servido, DOM, red, capturas en escritorio y en móvil a 390 px) y sobre el código del frontend. Del PDF se ha analizado la estructura de un fichero descargado de la web y la maquetación de `amm-curriculum-vitae-frontend/references/CV Antonio Macián Martínez.pdf` (3 páginas).

## Resumen

La base técnica es buena: HTML prerenderizado, metadatos Open Graph, carga rápida (~0,4 s), pestañas accesibles con roles ARIA. El problema no es técnico sino de **contenido y conversión**: un reclutador que entra ve cuatro nombres de empresa plegados, ningún enlace, ningún resumen y ninguna fecha. Lo que más pesa en una criba de 30 segundos está oculto o no existe.

Las cinco cosas que más impacto tendrían, por orden:

1. Mostrar la experiencia desplegada (o al menos cargo + fechas visibles sin clic).
2. Añadir enlaces: LinkedIn, GitHub, `mailto:` y `tel:`.
3. Añadir un resumen profesional de 3-4 líneas y reescribir los hitos con resultados.
4. Hacer que el PDF tenga texto real (ahora es una imagen; los ATS no lo leen).
5. Explicar la situación actual (desde 05/2025) y la disponibilidad.

---

## 1. Prioridad alta

### 1.1 La experiencia está plegada por defecto

Al entrar solo se leen "Aplanet", "PcComponentes", "Tissat/Alterna Tecnologías" y "Everis". Cargo, fechas, tecnologías e hitos exigen un clic por empresa.

- Un reclutador no hace cuatro clics; decide con lo que ve.
- Sin fechas visibles no se aprecia lo más valioso del perfil: ~12 años de experiencia y 6 en PcComponentes.

**Cambio:** en la cabecera de cada experiencia mostrar siempre empresa + cargo + fechas. Desplegar por defecto al menos la más reciente, o todas. El plegado puede quedarse solo para la lista de tecnologías.

Código: `ExperienciaItem.tsx` (la cabecera del `Expandable` solo lleva `experiencia.empresa`).

### 1.2 No hay ningún enlace en toda la página

El DOM no contiene ni un solo `<a>`. Faltan:

- **LinkedIn** — lo primero que busca un reclutador.
- **GitHub** — imprescindible en un perfil front-end; además este propio proyecto es una buena muestra.
- Email como `mailto:` y teléfono como `tel:` (ahora son `<span>`, no se pueden pulsar; en móvil obliga a copiar a mano).

**Cambio:** añadir campos `linkedin`, `github` (y opcional `web`) al perfil (`perfil.interface.ts`, formulario y backend) y pintarlos en `Contacto.tsx` junto a email y teléfono enlazados.

### 1.3 Falta un resumen profesional

El único texto de presentación es "Desarrollador web especializado en Front-End". No dice años de experiencia, stack principal, qué tipo de producto ha construido ni qué busca.

**Cambio:** un párrafo de 3-4 líneas bajo el nombre. Ejemplo de orientación (ajustar a la realidad):

> Desarrollador front-end con más de 12 años de experiencia, 6 de ellos en PcComponentes (e-commerce de alto tráfico). Especializado en React y TypeScript, con base full-stack (PHP/Symfony, Java). Foco en usabilidad, sistemas de componentes e integración de IA en producto.

Ese mismo texto debería alimentar la `meta description` (ahora 44 caracteres, se desaprovecha el snippet de Google y la tarjeta al compartir).

### 1.4 Los hitos describen tareas, no resultados

Ejemplos actuales: "Creación de componentes en React + Typescript", "Mantenimiento de web con Plantillas Twig, CSS y Javascript", "Integración de funciones de IA a la web".

- No hay cifras, alcance ni impacto.
- Aplanet (el puesto más reciente) solo tiene 2 hitos; Everis, ninguno.
- PcComponentes, 6 años, queda en 5 líneas genéricas.

**Cambio:** reescribir como acción + contexto + resultado. Por ejemplo: qué funciones de IA, para qué usuarios, qué mejoró; cuántos idiomas/mercados habilitó i18next; qué supuso el refactor del formulario de devoluciones (menos incidencias, menos tiempo de gestión, etc.). Solo con datos reales; si no hay cifra, al menos el alcance.

### 1.5 El PDF exportado es una imagen

`exportToPDF.ts` captura el HTML con html2canvas y lo inserta como JPEG. Consecuencias:

- El texto no es seleccionable ni buscable.
- **Los ATS (sistemas de criba automática) no pueden leerlo**: el CV llega vacío al filtro por palabras clave.
- Los enlaces no son pulsables y el fichero pesa más.

Comprobado sobre un PDF descargado de la web (07/10/2026), a nivel de estructura del fichero (la maquetación se valora en 2.8):

- 3 páginas, 815 KB.
- Contiene **una única imagen** de 1588×4882 px repetida y recortada en cada página.
- La extracción de texto (`pdftotext`) devuelve **vacío**: cero palabras legibles para un ATS o para el buscador de un reclutador.
- Sin metadatos de título, autor ni idioma (solo `Producer: jsPDF 3.0.1`).
- Sin enlaces pulsables.
- Nombre de fichero `CV Antonio Macián Martínez.pdf`: correcto y descriptivo.

**Cambio:** generar el PDF con texto real y rellenar los metadatos (título, autor, idioma). Opciones: `@react-pdf/renderer`, jsPDF escribiendo texto, o una hoja de estilos `@media print` + `window.print()` (hoy no existe ninguna regla de impresión). Alternativa mínima: servir un PDF estático ya maquetado.

Además, el botón dice "Exportar a PDF", que suena a herramienta interna; para un visitante es más claro "Descargar CV (PDF)".

### 1.6 Periodo sin explicar desde 05/2025

La última experiencia termina en 05/2025 y hoy es 10/2026: unos 17 meses. La formación reciente (React PRO, Unity 6, Inglés B2, IA Claude Code) lo explica, pero está en otra pestaña y nadie la relaciona.

También hay huecos 01/2013–05/2014 (coincide con el Grado, finalizado 10/2013) y 05/2023–01/2024.

**Cambio:** hacerlo explícito. Opciones: una entrada de experiencia tipo "Formación y proyectos propios (2025–actualidad)" enlazando a los proyectos, y una línea de **disponibilidad** ("Disponible para incorporación inmediata · remoto / híbrido en Murcia").

---

## 2. Prioridad media

### 2.1 Conocimientos: 41 elementos planos, en orden alfabético

- La lista empieza por "Ajax", "Arquitectura Hexagonal", "BI"; React y TypeScript quedan abajo, tras hacer scroll dentro del panel.
- El **nivel** (Básico / Intermedio / Avanzado) existe en los datos pero no se muestra (`ConocimientoItem.tsx` solo pinta el título).
- Mezcla tecnologías actuales con otras antiguas o de poco peso (Ajax, jQuery, Java Swing, PowerCenter, MicroStrategy), lo que diluye el perfil front-end.
- "Otros lenguajes de programación (Python, C++, C#...)" es vago.

**Cambio:** agrupar por categoría (Front-end, Back-end, Testing, Herramientas, Metodología, IA) y ordenar por relevancia/nivel, con el stack principal arriba. Mostrar el nivel o, mejor, destacar solo las 8-10 principales y dejar el resto como "También he trabajado con".

### 2.2 Tecnologías por experiencia demasiado largas

PcComponentes lista 29 etiquetas en orden alfabético. No se distingue lo que se usó a diario de lo tangencial.

**Cambio:** limitar a las 8-10 principales por puesto, ordenadas por peso.

### 2.3 No hay sección de proyectos

Para un front-end, ver código y resultados pesa tanto como el historial. No hay portfolio ni enlaces a repos.

**Cambio:** nueva pestaña "Proyectos" con 2-4 fichas (nombre, descripción breve, stack, enlace a demo y repo). Este CV (React + TypeScript + Redux + prerender + backend propio) y los proyectos de Unity encajan.

### 2.4 Solo en español

El perfil incluye Inglés B2 (05/2026) pero la web no tiene versión en inglés. Para ofertas en remoto o empresas internacionales es una barrera, y es incoherente con haber integrado i18next profesionalmente.

**Cambio:** versión EN con selector de idioma y `hreflang`.

### 2.5 Idiomas escondidos

"Inglés B2" figura como un curso dentro de Formación Complementaria. Es un dato que los reclutadores filtran.

**Cambio:** bloque "Idiomas" visible en la columna de contacto.

### 2.6 Datos personales expuestos

- El teléfono y el código postal están en abierto, indexables por cualquier bot.
- El JSON incrustado en el HTML (`window.__CURRICULUM__`) incluye **`fechaNacimiento`**, aunque no se muestre en pantalla. Cualquiera puede leerlo en el código fuente.

**Cambio:** no enviar `fechaNacimiento` en el endpoint público (`/api/curriculum`) ni en el prerender. Valorar dejar solo "Murcia (España)" como ubicación y mostrar el teléfono únicamente en el PDF o tras una acción del usuario.

### 2.7 Dominio

`antonio-macian-martinez-cv-delta.vercel.app` es largo y el sufijo `-delta` parece provisional. Además la API está en otro subdominio distinto.

**Cambio:** dominio propio (p. ej. `antoniomacian.dev`) o, como mínimo, un alias de Vercel limpio. Añadirlo después a LinkedIn y al PDF.

### 2.8 Maquetación del PDF

Valorado sobre `references/CV Antonio Macián Martínez.pdf`. El diseño es limpio y coherente con la web (foto, tipografía, azul de sección, jerarquía clara de empresa → cargo → fechas). Los problemas son de aprovechamiento de espacio y de cortes de página.

**Ocupa 3 páginas pudiendo ocupar 2 (o 1,5)**

- La página 3 está vacía en más de la mitad.
- La página 1 termina con ~15 % en blanco al pie.
- A partir de la página 2 la columna izquierda queda vacía en cuanto acaba "Conocimientos", y en la página 3 está vacía entera: un tercio del ancho sin usar.

**Cortes de página mal resueltos**

- **Everis** queda partido: empresa y cargo al pie de la página 2, fechas y tecnologías en la 3. El bloque empresa + cargo + fechas debería ser indivisible.
- La lista de tecnologías de **PcComponentes** se parte entre las páginas 1 y 2; sus hitos caen en una página distinta a la de su cabecera.
- "Conocimientos" continúa en la página 2 sin repetir título.

Código: `exportToPDF.ts` solo mantiene unido cada título con el elemento siguiente (`CON_SIGUIENTE`); el cargo y las fechas no entran en esa regla.

**Las tecnologías consumen demasiado espacio**

- Listas con viñeta en 2 columnas, con una tercera columna libre a la derecha. Las 29 de PcComponentes ocupan media página.
- Cada fila de la rejilla toma la altura del elemento más largo, lo que deja huecos irregulares ("Otros lenguajes de programación…" junto a "Patrones de diseño") y un "Typescript" suelto al final.

**Cambio:** tecnologías en línea, separadas por comas o como etiquetas compactas, limitadas a las principales (ver 2.2). Solo con eso el CV cabe en 2 páginas.

**La columna "Conocimientos" duplica y diluye**

- 41 elementos en negrita, alfabéticos, sin nivel: repite lo que ya aparece en cada experiencia y es lo primero que se ve tras la foto.
- Empuja fuera de la primera página lo importante.

**Cambio:** sustituirla por 8-10 competencias clave agrupadas (ver 2.1) y usar el espacio liberado para idiomas, enlaces y disponibilidad.

**Jerarquía tipográfica**

- Los hitos van en un cuerpo mayor que el cargo y bastante mayor que la formación; las tecnologías en negrita pesan más que los hitos. Unificar: texto base único, negrita solo para empresa y titulación.

**Contenido que falta en el PDF**

- Sin resumen profesional, LinkedIn ni GitHub (ver 1.2 y 1.3). En el PDF las URLs deben ir escritas además de enlazadas, porque puede imprimirse.
- La formación académica pierde el detalle que sí da la web (Proyecto Fin de Grado, intensificación).
- Sin numeración de página ni nombre en las páginas 2 y 3: si se imprime y se separan las hojas, no se sabe de quién son.
- "Inglés B2" aparece solo como curso (ver 2.5).

**Orden**

- Con la experiencia más reciente terminada en 05/2025, la formación de 2025-2026 (React PRO, Claude Code, Inglés B2) es lo más actual del perfil y queda al final de la última página. Valorar subir un bloque "Formación reciente" o reflejarlo en el resumen (ver 1.6).

---

## 3. Prioridad baja (SEO, accesibilidad, técnica)

### 3.1 Estructura semántica

- **No hay `<h1>`**: el nombre es un `<span>`.
- Todos los ítems son `<h2>`, incluidas las 41 tecnologías; no existen títulos de sección.
- No hay landmarks (`<main>`, `<header>`, `<section>`, `<footer>`).

**Cambio:** nombre en `<h1>`, secciones en `<h2>`, ítems en `<h3>`; tecnologías como lista `<ul>/<li>`; envolver en `<main>`.

### 3.2 Datos estructurados y metadatos

- Sin JSON-LD. Añadir schema.org `Person` (name, jobTitle, url, sameAs con LinkedIn/GitHub, alumniOf, knowsAbout).
- Sin `<link rel="canonical">`.
- `og:image` y favicon apuntan a una miniatura de Google Drive: depende de un tercero, puede devolver 429 o caducar y dejar la vista previa rota al compartir el enlace en LinkedIn/WhatsApp. Alojar la foto en el propio dominio y usar una imagen OG de 1200×630.
- Faltan `twitter:title`, `twitter:description`, `twitter:image`.

### 3.3 Sitemap y 404

`/sitemap.xml`, `/manifest.json` y cualquier ruta inexistente devuelven **200 con el HTML de la SPA** (soft 404). No hay sitemap real y `robots.txt` no lo declara.

**Cambio:** generar `sitemap.xml` en el build, referenciarlo en `robots.txt` y devolver 404 real en rutas desconocidas. Añadir `noindex` a `/login`.

### 3.4 Peticiones innecesarias en la página pública

- Se llama a `/api/auth/renew` para todos los visitantes anónimos. Solo debería ejecutarse si hay token guardado.
- Se vuelve a pedir `/api/curriculum` (~0,5 s) aunque los datos ya vienen incrustados en el HTML prerenderizado.

### 3.5 Carga

- Bundle JS: 302 KB (104 KB comprimido) para una página estática. Margen para separar el código del panel de administración (login, formularios, Redux CRUD) con `lazy()`.
- La foto se pide a 1000px para mostrarse a 150px. Servir ~300-400px en WebP/AVIF y declarar `height` además de `width` para evitar salto de maquetación.
- Fuente Sora desde Google Fonts: valorar autoalojarla.

### 3.6 Diseño y uso

- En escritorio el contenido ocupa la mitad superior y queda mucho espacio vacío; con la experiencia desplegada (1.1) se resuelve en parte.
- El panel de pestañas tiene scroll interno en escritorio: hay contenido que queda oculto sin indicio claro. Mejor scroll de página normal.
- Las pestañas impiden ver el CV de un vistazo y hacer Ctrl+F sobre todo el contenido. Alternativa: una sola página con secciones y navegación por anclas.
- El triángulo del desplegable apunta hacia abajo estando cerrado y hacia arriba abierto; lo habitual es derecha (cerrado) / abajo (abierto).
- Sin modo oscuro (`prefers-color-scheme` no está contemplado). Opcional, pero suma en un perfil front-end.
- Sin pie de página: añadir fecha de última actualización y enlace al repositorio ("Hecho con React + TypeScript · ver código").

### 3.7 Vista móvil (390 px)

Funciona bien en general: sin scroll horizontal, nombre sin recortar, foto y contacto en una fila compacta, botón de PDF a ancho completo, barra de pestañas fija (`sticky`) con menú desplegable que se cierra al elegir, y el contenido empieza a ~430 px, visible en la primera pantalla. Mejoras:

- **Conocimientos en una sola columna**: 41 tarjetas apiladas dan una página de ~3.700 px de alto. Pasar a etiquetas compactas (como las tecnologías de cada experiencia) o a 2 columnas; se resuelve junto con 2.1.
- **Tecnologías de PcComponentes**: las 29 etiquetas ocupan una pantalla entera antes de llegar a los hitos. Refuerza 2.2; alternativamente, poner los hitos antes que las tecnologías.
- **Email partido en dos líneas** ("antoniomacianmartinez@" / "gmail.com"). Reducir un punto el tamaño o dar más ancho a la columna de contacto.
- **Botón hamburguesa de 30×24 px**: por debajo del mínimo táctil recomendado (44×44). Ampliar el área pulsable.
- **Teléfono y email no pulsables** (ver 1.2): en móvil es donde más se nota, no se puede llamar ni escribir con un toque.
- La experiencia plegada (1.1) pesa igual que en escritorio: en la primera pantalla solo se leen dos nombres de empresa.

### 3.8 Detalles de contenido

- Unificar grafías: "FrontEnd" / "Frontend" / "Front-End"; "Typescript" → "TypeScript"; "Javascript" → "JavaScript"; "JQuery" → "jQuery"; "IA ClaudeCode" → "Claude Code".
- "Proyecto Fin de Grado -> Lenguaje…": sustituir la flecha por dos puntos.
- Fechas de formación con un solo mes ("10/2013"): indicar que es fecha de finalización o usar solo el año.
- Añadir modalidad y ubicación a cada experiencia (remoto / Murcia / Valencia…).
- La foto es correcta y profesional. Tenerla en cuenta si se opta a empresas de EE. UU./Reino Unido, donde no se suele incluir.

---

## 4. Orden de trabajo sugerido

| Fase | Cambios | Esfuerzo |
|------|---------|----------|
| 1 | 1.1 experiencia visible · 1.2 enlaces · 1.3 resumen · 2.6 quitar `fechaNacimiento` | Bajo |
| 2 | 1.4 reescribir hitos · 1.6 situación actual y disponibilidad · 2.5 idiomas · 3.8 grafías | Bajo (contenido) |
| 3 | 1.5 PDF con texto · 2.8 maquetación del PDF (2 páginas, cortes) · 2.1 y 2.2 conocimientos agrupados y priorizados | Medio |
| 4 | 2.3 proyectos · 3.1 semántica · 3.2 JSON-LD y OG propio · 3.3 sitemap/404 | Medio |
| 5 | 2.4 versión en inglés · 2.7 dominio propio · 3.4-3.7 rendimiento, diseño y móvil | Medio-alto |
