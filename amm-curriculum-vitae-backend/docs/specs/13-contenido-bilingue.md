# SPEC 13 — Contenido bilingüe (ES/EN) y sugerencia de traducción

> **Estado:** Aprobada
> **Depende de:** SPEC 11 (`11-prioridad-conocimiento.md`), cuyo `enum` se cambia a claves; SPEC 12 (`12-extras-formacion.md`), cuyo helper `descripcionesHijas.js` se adapta
> **Fecha:** 2026-11-02
> **Objetivo:** Guardar en la base el texto libre del currículum en español e inglés (`{ es, en }` por campo), servir `GET /api/curriculum?lang=es|en` con el texto ya resuelto y exponer `POST /api/traduccion` (DeepL API Free) para que el admin sugiera la versión EN.

## Alcance

**Dentro:**

- Nuevo `models/plugins/localizado.js`: sub-schema `{ es, en }` reutilizable.
- Campos que pasan a `{ es, en }`:

  | Modelo | Campos |
  | ------ | ------ |
  | `Experiencia` | `descripcion` |
  | `Hito` | `descripcion` |
  | `Formacion` | `titulo`, `institucion` |
  | `Extra` | `descripcion` |
  | `FormacionComplementaria` | `titulo`, `institucion` |
  | `Perfil` | `descripcion`, `direccion`, `disponibilidad`, `idiomas[].idioma`, `idiomas[].nivel` |

- `Conocimiento.prioridad`: el `enum` pasa de texto en español a claves (`muyAlta`, `alta`, `media`, `baja`, `muyBaja`; por defecto `media`).
- `helpers/descripcionesHijas.js`: `descripcion` de hitos y extras pasa a `{ es, en }`.
- Nuevo `helpers/resolverIdioma.js` y `GET /api/curriculum?lang=` con el texto resuelto.
- Nuevo `POST /api/traduccion` (con JWT) que traduce de ES a EN con `deepl-node`.
- Migración `mongosh` de los datos existentes (`en: ''`).
- Tests nuevos y adaptación de fixtures y tests existentes.

**Fuera de alcance:**

- Más idiomas que ES y EN. El sub-schema tiene las dos claves fijas: no hay lista de idiomas configurable.
- Traducir campos que no son texto libre: `empresa`, `Conocimiento.titulo` (nombres de tecnologías), `nombre`, `apellidos`, `email`, `telefono`, URLs y fechas.
- Traducción automática al leer: la traducción solo se pide desde el admin y se guarda revisada.
- Cache de traducciones o glosario de DeepL.
- Cambios en `scripts/clonarBBDD.js`: clona los documentos tal cual.

## Modelo de datos

```js
// models/plugins/localizado.js
const { Schema } = require('mongoose');

// Texto libre en los dos idiomas del CV. `es` es el original; `en` puede
// quedar vacío y entonces la API pública cae a `es`.
const localizado = ({ required = false } = {}) => ({
  type: new Schema(
    {
      es: { type: String, trim: true, required },
      en: { type: String, trim: true, default: '' },
    },
    { _id: false },
  ),
  required,
});

module.exports = { localizado };
```

- Un campo que hoy es `required` usa `localizado({ required: true })`: exige `es`, nunca `en`.
- `Perfil.idiomas` mantiene su sub-schema, con `idioma` y `nivel` como `localizado({ required: true })`.
- Gracias a `{ _id: false }`, el `toJSON` actual devuelve `{ es, en }` sin `id`.

`Conocimiento.prioridad`:

```js
prioridad: {
  type: String,
  required: true,
  enum: ['muyAlta', 'alta', 'media', 'baja', 'muyBaja'],
  default: 'media',
},
```

## Contrato

### Escritura (admin): `POST`/`PUT` de experiencia, formación, formación complementaria y perfil

Los campos de la tabla llegan como objeto:

```json
{
  "titulo": { "es": "Grado en Informática", "en": "BSc in Computer Science" },
  "institucion": { "es": "Universidad de Valencia", "en": "" },
  "fechaFin": "2015-06-30",
  "extras": [
    { "id": "<opcional>", "descripcion": { "es": "Rama de software", "en": "Software track" } }
  ]
}
```

- `en` ausente → `''`.
- Si llega un string en un campo localizado, el cast falla y responde el `500` genérico de `conContexto` (ver Decisiones).
- Hitos y extras: se descartan los que tengan `descripcion.es` vacío o de solo espacios. Se mantienen la reconciliación por id y el formato antiguo `["texto"]`, que pasa a `{ es: texto, en: '' }`.

### Lectura del admin: `GET /api/experiencia`, `/formacion`, `/formacionComplementaria`, `/perfil`, `/conocimiento`

Sin cambios de ruta. Devuelven los objetos `{ es, en }` completos, porque el admin necesita los dos idiomas.

### Lectura pública: `GET /api/curriculum?lang=es|en`

- Mismo shape que hoy, pero cada `{ es, en }` se sustituye por un string: `en` si `lang=en` y `en` no está vacío; si no, `es`.
- Sin `lang`, o con un valor distinto de `es`/`en`, se resuelve en `es`. Así el frontend actual y su prerender siguen funcionando durante el despliegue.

```js
// helpers/resolverIdioma.js
// Recorre el JSON ya normalizado por toJSON y sustituye cada { es, en } por un string.
const esLocalizado = (valor) =>
  valor !== null &&
  typeof valor === 'object' &&
  !Array.isArray(valor) &&
  Object.keys(valor).sort().join() === 'en,es';

const resolverIdioma = (valor, idioma) => {
  if (Array.isArray(valor)) return valor.map((v) => resolverIdioma(v, idioma));
  if (esLocalizado(valor)) return (idioma === 'en' && valor.en) || valor.es;
  if (valor !== null && typeof valor === 'object' && !(valor instanceof Date)) {
    return Object.fromEntries(
      Object.entries(valor).map(([k, v]) => [k, resolverIdioma(v, idioma)]),
    );
  }
  return valor;
};
```

`obtenerCurriculum` serializa con `JSON.parse(JSON.stringify(...))` (o `toJSON()` por documento) y aplica `resolverIdioma` antes de `res.json`.

### Traducción: `POST /api/traduccion` (requiere `x-token`)

```json
// Petición
{ "textos": ["Desarrollo de la nueva intranet", "Universidad de Valencia"] }
// 200
{ "textos": ["Development of the new intranet", "University of Valencia"] }
```

- Origen `es`, destino `en-GB`. `deepl-node` no acepta `en` a secas como destino.
- Validación (`400`, mensaje propio): `textos` debe ser un array de 1 a 50 strings no vacíos y sumar como mucho 5000 caracteres.
- Sin `DEEPL_API_KEY` → `503 Traducción no disponible`.
- Cuota agotada (`QuotaExceededError` de `deepl-node`) → `429 Cuota de traducción agotada`.
- Cualquier otro error de DeepL → `502 Error del servicio de traducción`.
- El cliente se crea una vez por instancia: `new deepl.Translator(process.env.DEEPL_API_KEY)`. Una clave terminada en `:fx` usa sola el host de la API Free.

## Migración (mongosh)

Ejecutar en cada base **justo antes** de desplegar el backend y hacer copia antes (`npm run clone-db`).

```js
const loc = (campo) => ({ es: { $ifNull: [`$${campo}`, ''] }, en: '' });

db.experiencias.updateMany({ 'descripcion.es': { $exists: false } }, [
  { $set: { descripcion: loc('descripcion') } },
]);
db.hitos.updateMany({ 'descripcion.es': { $exists: false } }, [
  { $set: { descripcion: loc('descripcion') } },
]);
db.extras.updateMany({ 'descripcion.es': { $exists: false } }, [
  { $set: { descripcion: loc('descripcion') } },
]);
db.formacions.updateMany({ 'titulo.es': { $exists: false } }, [
  { $set: { titulo: loc('titulo'), institucion: loc('institucion') } },
]);
db.formacioncomplementarias.updateMany({ 'titulo.es': { $exists: false } }, [
  { $set: { titulo: loc('titulo'), institucion: loc('institucion') } },
]);
db.perfils.updateMany({ 'descripcion.es': { $exists: false } }, [
  {
    $set: {
      descripcion: loc('descripcion'),
      direccion: loc('direccion'),
      disponibilidad: loc('disponibilidad'),
      idiomas: {
        $map: {
          input: { $ifNull: ['$idiomas', []] },
          in: {
            idioma: { es: '$$this.idioma', en: '' },
            nivel: { es: '$$this.nivel', en: '' },
          },
        },
      },
    },
  },
]);
db.conocimientos.updateMany({}, [
  {
    $set: {
      prioridad: {
        $switch: {
          branches: [
            { case: { $eq: ['$prioridad', 'Muy alta'] }, then: 'muyAlta' },
            { case: { $eq: ['$prioridad', 'Alta'] }, then: 'alta' },
            { case: { $eq: ['$prioridad', 'Baja'] }, then: 'baja' },
            { case: { $eq: ['$prioridad', 'Muy baja'] }, then: 'muyBaja' },
          ],
          default: 'media',
        },
      },
    },
  },
]);
```

- El filtro `{ 'x.es': { $exists: false } }` hace la migración idempotente.
- Los nombres de colección son los que genera Mongoose; comprobar con `show collections` antes de ejecutar.
- Si `disponibilidad` falta, queda como `{ es: '', en: '' }`. Es aceptable porque no es `required`, y el frontend lo trata como vacío.

Verificación:

```js
db.experiencias.countDocuments({ descripcion: { $type: 'string' } }); // 0
db.hitos.countDocuments({ descripcion: { $type: 'string' } }); // 0
db.extras.countDocuments({ descripcion: { $type: 'string' } }); // 0
db.formacions.countDocuments({ titulo: { $type: 'string' } }); // 0
db.formacioncomplementarias.countDocuments({ titulo: { $type: 'string' } }); // 0
db.perfils.countDocuments({ descripcion: { $type: 'string' } }); // 0
db.conocimientos.countDocuments({
  prioridad: { $nin: ['muyAlta', 'alta', 'media', 'baja', 'muyBaja'] },
}); // 0
```

## Plan de implementación

1. **Sub-schema.** Crear `models/plugins/localizado.js` y aplicarlo a los modelos de la tabla. Cambiar el `enum` de `prioridad`. Actualizar `test/utils/fixtures.js` para sembrar `{ es, en }` y `prioridad: 'media'`. Prueba: el servidor arranca.
2. **Controladores de escritura.** Experiencia, formación, formación complementaria y perfil ya asignan el valor recibido; solo cambia el tipo. En perfil, `disponibilidad || undefined` pasa a aceptar el objeto. Prueba: `POST` con `{ es, en }` guarda y devuelve los dos.
3. **`descripcionesHijas.js`.** `normalizarDescripciones` devuelve `{ id, descripcion: { es, en } }` con los dos trimados, filtra por `es` vacío y acepta el string antiguo. `updateOne` e `insertMany` guardan el objeto. Prueba: tests de hitos y extras adaptados en verde.
4. **`resolverIdioma` y `/api/curriculum`.** Helper con test unitario propio. `obtenerCurriculum` lee `req.query.lang`. Prueba: `?lang=en` devuelve `en`, cae a `es` si `en` está vacío, y sin `lang` devuelve `es`.
5. **Traducción.** `npm i deepl-node`. Crear `controllers/traduccion.js` y `routes/traduccion.js` con `validarJWT` y montarlos en `index.js` como `/api/traduccion`. Añadir `DEEPL_API_KEY` a `.env.example` y al README. Los tests mockean `deepl-node` con `vi.mock`, sin llamadas reales.
6. **Tests nuevos:**
   - `curriculum.test.js`: `lang=en` con y sin `en` relleno, `lang=fr`, sin `lang`, e `idiomas` de perfil resueltos.
   - Cada CRUD: `POST` sin `en` guarda `en: ''`. `PUT` cambia solo `en`. `POST` con un string en un campo localizado responde `500` y no crea nada.
   - `conocimiento.test.js`: la `prioridad` antigua `'Alta'` responde `500` y `'alta'` responde `201`.
   - `traduccion.test.js`: `401` sin token, `400` por validación, `200` mockeado, `503` sin clave, `429` por cuota y `502` por error genérico.
7. `npm test`, `npm run test:coverage`, `npm run lint`.
8. **Local.** Copia de la base, migración y verificación. Prueba manual: `GET /api/curriculum?lang=en` devuelve el texto en español (con `en` vacío cae a `es`).
9. **Producción.** Crear la cuenta de DeepL API Free y añadir `DEEPL_API_KEY` en Vercel. Copia, migración, despliegue y verificación. Justo después, desplegar el frontend de la SPEC 23.

## Criterios de aceptación

- [ ] Los campos de la tabla se guardan y se devuelven como `{ es, en }` en `GET`, `POST` y `PUT` de sus endpoints.
- [ ] `en` ausente en el body se guarda como `''`; `es` vacío en un campo `required` responde `500` y no escribe.
- [ ] Hitos y extras guardan `descripcion: { es, en }`; los que tienen `es` vacío se descartan; la reconciliación por id se mantiene.
- [ ] `GET /api/curriculum?lang=en` devuelve strings: `en` si existe y `es` si no.
- [ ] `GET /api/curriculum` sin `lang` o con un idioma no soportado devuelve strings en `es`.
- [ ] `prioridad` solo acepta `muyAlta|alta|media|baja|muyBaja` y por defecto es `media`.
- [ ] `POST /api/traduccion` sin token → `401`; con datos inválidos → `400`; correcto → `200` con `textos` en el mismo orden.
- [ ] `503`, `429` y `502` según el caso de error de DeepL descrito.
- [ ] La clave de DeepL solo vive en el backend (`DEEPL_API_KEY`) y nunca aparece en una respuesta.
- [ ] Tras migrar, las verificaciones dan `0` en local y en producción, y los `_id` no cambian.
- [ ] `npm test` y `npm run test:coverage` en verde con el umbral del 80%.

## Decisiones

- **Sí:** objeto `{ es, en }` por campo dentro del mismo documento. **No:** un documento por idioma ni una colección de traducciones aparte, porque obligan a sincronizar fechas, orden y referencias.
- **Sí:** solo `es` y `en` como claves fijas del sub-schema. **No:** un `Map` de idiomas ni una lista configurable, por decisión del usuario.
- **Sí:** `es` es obligatorio y `en` opcional, con fallback a `es` en la lectura pública. Se puede desplegar sin haber traducido nada.
- **Sí:** el admin lee los dos idiomas y la API pública los resuelve. **No:** que el frontend público reciba `{ es, en }`: el payload sería el doble y el frontend actual se rompería en el despliegue.
- **Sí:** `resolverIdioma` genérico sobre el JSON, que detecta objetos con exactamente las claves `es` y `en`. **No:** un resolutor por modelo. Ningún otro objeto del dominio tiene esas dos claves.
- **Sí:** las prioridades pasan a claves para que el frontend las traduzca con i18next. **No:** guardar `prioridad` como `{ es, en }`, porque es un valor cerrado y no texto libre.
- **Sí:** DeepL API Free (500 000 caracteres al mes, gratis y con la mejor calidad ES→EN), llamada desde el backend. **No:** la API de Claude, que es de pago. **No:** MyMemory ni LibreTranslate público, por calidad y límites diarios bajos. **No:** llamar desde el frontend, porque expondría la clave.
- **Sí:** `en-GB` como destino, por ser un CV orientado a Europa.
- **Sí:** traducción bajo JWT. Solo la usa el admin y así nadie gasta la cuota.
- **No:** aceptar strings en los campos localizados por compatibilidad. El admin anterior no puede leer los objetos de todos modos, así que los dos repos se despliegan seguidos.
- **Sí:** migración `mongosh` manual e idempotente (precedente de las SPEC 10, 11 y 12).

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Entre el despliegue del backend y el del frontend, el admin anterior recibe objetos donde espera strings | La parte pública sigue bien porque `/curriculum` sin `lang` devuelve strings. El admin se rompe unos minutos: desplegar la SPEC 23 justo después y no editar entretanto |
| El frontend anterior ordena por las prioridades antiguas (`'Muy alta'`…) | `indicePrioridad` trata un valor desconocido como Media: el orden por prioridad se pierde unos minutos, no se rompe |
| La migración se ejecuta a medias o dos veces | Filtros idempotentes, copia previa con `clone-db` y verificaciones con `countDocuments` |
| Un campo opcional sin valor (`disponibilidad`) pasa a `{ es: '', en: '' }` | El frontend trata `''` como ausente, igual que hoy |
| Se agota la cuota de DeepL o cambia el plan gratuito | `429`/`503` controlados: el admin muestra el error y se puede traducir a mano |
| `resolverIdioma` convierte un objeto que no es localizado | Solo actúa con las claves exactas `{ en, es }`; test unitario con objetos de otras claves |
