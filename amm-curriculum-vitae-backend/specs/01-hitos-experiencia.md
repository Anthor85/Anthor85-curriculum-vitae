# SPEC 01 — Hitos asociados a Experiencia

> **Estado:** Implementada
> **Depende de:** —
> **Fecha:** 2026-08-28
> **Objetivo:** Añadir una colección `hitos` en Mongo con un texto y una referencia a `Experiencia`, y adaptar el backend de Experiencia para crearlos y devolverlos junto a cada experiencia.

## Alcance

**Dentro:**

- Nuevo modelo `models/Hito.js` con `descripcion` (String) y `experiencia` (ObjectId, ref `Experiencia`).
- Virtual `hitos` en `models/Experiencia.js` que resuelve la relación inversa.
- `obtenerExperiencias` devuelve cada experiencia con su array `hitos` poblado.
- `crearExperiencia` acepta N hitos en el body y los crea asociados a la experiencia recién guardada.
- `eliminarExperiencia` borra en cascada los hitos de esa experiencia.
- `controllers/curriculum.js` devuelve las experiencias con sus hitos poblados.
- Comandos `mongosh` de creación de colección e índice, y de verificación.

**Fuera de alcance (para futuras specs):**

- Cualquier cambio en el frontend `../amm-curriculum-vitae` (interface, slice, hook, `ExperienciaForm`, `ExperienciaCard`). Va en su propia spec.
- Endpoints propios `/api/hito` (CRUD independiente de hitos).
- Edición de hitos de una experiencia existente (hoy no existe `PUT /api/experiencia/:id`).
- Orden manual de los hitos dentro de una experiencia.
- Migración de datos existentes: hoy no hay hitos que migrar.

## Modelo de datos

`models/Hito.js`:

```js
const HitoSchema = Schema({
  descripcion: { type: String, required: true, trim: true },
  experiencia: { type: Schema.Types.ObjectId, ref: "Experiencia", required: true },
});
```

`HitoSchema.method("toJSON", ...)` replica la convención del resto de modelos: elimina `__v` y `_id`, y expone `id`.

En `models/Experiencia.js` se añade un virtual, sin campo persistido:

```js
ExperienciaSchema.virtual("hitos", {
  ref: "Hito",
  localField: "_id",
  foreignField: "experiencia",
});
```

El virtual solo aparece en el JSON cuando se ha hecho `populate("hitos")`; hay que activar `toJSON: { virtuals: true }` en las opciones del schema y mantener el `toJSON` personalizado existente.

Forma del recurso que devuelve `GET /api/experiencia`:

```json
{
  "id": "665...",
  "empresa": "ACME",
  "descripcion": "Backend developer",
  "fechaInicio": "2020-01-01T00:00:00.000Z",
  "fechaFin": null,
  "tecnologias": ["664..."],
  "hitos": [{ "id": "667...", "descripcion": "Migré el monolito a servicios", "experiencia": "665..." }]
}
```

Contrato de entrada en `POST /api/experiencia`: el campo `hitos` llega repetido, un valor por input del form. El controlador normaliza con `[].concat(req.body.hitos ?? [])`, hace `trim` y descarta cadenas vacías. **No** se parte por comas (a diferencia de `tecnologias`), porque el texto de un hito puede contenerlas.

### Queries Mongo

Mongo crea la colección al primer insert, así que el `createCollection` es opcional; el índice no lo es.

```js
// mongosh
db.createCollection("hitos");
db.hitos.createIndex({ experiencia: 1 });
```

Verificación manual:

```js
db.hitos.find({ experiencia: ObjectId("<id de la experiencia>") });
db.hitos.countDocuments();
```

## Plan de implementación

1. Crear `models/Hito.js` con el schema y el `toJSON` de la convención del proyecto. Prueba: `node -e "require('./models/Hito')"` no lanza error.
2. Añadir a `models/Experiencia.js` las opciones `{ toJSON: { virtuals: true } }` y el virtual `hitos`. El `toJSON` personalizado debe seguir devolviendo `id` y seguir ocultando `_id` y `__v`. Prueba: `GET /api/experiencia` sigue devolviendo el mismo JSON que antes.
3. En `controllers/experiencia.js`, cambiar `obtenerExperiencias` a `Experiencia.find().populate("hitos")`. Prueba: `GET /api/experiencia` devuelve `hitos: []` en cada experiencia.
4. En `crearExperiencia`, tras `nuevaExperiencia.save()`, normalizar `req.body.hitos`, hacer `Hito.insertMany(...)` con el `experiencia: nuevaExperiencia._id` y responder con la experiencia poblada. Si no llegan hitos, el comportamiento es idéntico al actual. Prueba: POST con dos campos `hitos` crea dos documentos en `db.hitos`.
5. En `eliminarExperiencia`, añadir `await Hito.deleteMany({ experiencia: id })` antes o después del `findByIdAndDelete`, e incluir el número de hitos borrados en la respuesta. Prueba: tras borrar la experiencia, `db.hitos.find({ experiencia: ... })` está vacío.
6. En `controllers/curriculum.js`, cambiar `Experiencia.find()` por `Experiencia.find().populate("hitos")`. Prueba: `GET /api/curriculum` incluye los hitos.
7. Crear el índice `{ experiencia: 1 }` en la base de datos con `mongosh`.

## Criterios de aceptación

- [ ] `GET /api/experiencia` devuelve, para cada experiencia, un array `hitos` (vacío si no tiene).
- [ ] Cada hito del JSON expone `id`, `descripcion` y `experiencia`, y no expone `_id` ni `__v`.
- [ ] `POST /api/experiencia` con tres campos `hitos` crea tres documentos en la colección `hitos`, todos con `experiencia` igual al id de la experiencia creada.
- [ ] `POST /api/experiencia` sin ningún campo `hitos` responde 201 y crea la experiencia con `hitos: []`.
- [ ] Un valor de `hitos` que sea cadena vacía o solo espacios no crea documento.
- [ ] Un hito con comas en el texto se guarda como un único documento con el texto íntegro.
- [ ] `DELETE /api/experiencia/:id` deja `db.hitos.countDocuments({ experiencia: ObjectId(id) })` a 0.
- [ ] `GET /api/curriculum` devuelve las experiencias con sus hitos poblados.
- [ ] `db.hitos.getIndexes()` incluye el índice sobre `experiencia`.

## Decisiones

- **Sí:** referencia en el lado del hito (`Hito.experiencia`). Es lo que pidió el usuario y evita mantener sincronizados dos lados.
- **No:** array `hitos: [ObjectId]` dentro de `Experiencia`, ni doble referencia. Duplicar la relación obliga a mantenerla en dos escrituras.
- **No:** subdocumentos embebidos dentro de `Experiencia`. El usuario pidió explícitamente una colección con su propio id.
- **Sí:** virtual + `populate`, para que el frontend reciba los hitos ya resueltos y no tenga que cruzarlos a mano (como hoy hace `ExperienciaCard` con `conocimiento`).
- **Sí:** solo endpoints anidados bajo `/api/experiencia`. Un CRUD `/api/hito` no aporta nada mientras los hitos solo se editen desde el form de Experiencia.
- **Sí:** borrado en cascada. Al no existir `/api/hito`, sin cascada no habría forma de borrar hitos huérfanos.
- **No:** `split(",")` para los hitos, a diferencia de `tecnologias`. El texto libre puede contener comas.
- **Sí:** índice sobre `experiencia`. Toda lectura de hitos filtra por ese campo.
- **Nota pendiente:** `crearExperiencia` lee `req.body` con `express.json()`, pero el form del frontend envía `FormData` (multipart). Si el multipart no se está parseando, el problema ya existe hoy con `tecnologias` y se aborda fuera de esta spec.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Activar `toJSON: { virtuals: true }` cambia el JSON de Experiencia (aparece `id` duplicado por el virtual `id` de Mongoose) | El `toJSON` personalizado ya construye `object.id`; verificar en el paso 2 que la respuesta no cambia respecto a la actual antes de seguir. |
| `insertMany` falla tras haber guardado la experiencia y deja una experiencia sin sus hitos | Devolver 500 y documentar que la experiencia queda creada; el usuario puede borrarla y repetir. Sin transacciones (requieren replica set). |
| El campo `hitos` llega como string único cuando solo hay un input | La normalización con `[].concat(...)` cubre string, array y `undefined`. |

## Lo que **no** entra en esta spec

- El frontend `../amm-curriculum-vitae` (inputs dinámicos en `ExperienciaForm`, render en `ExperienciaCard`, interface, slice y hook).
- Endpoints `/api/hito`.
- Edición de hitos de una experiencia ya creada.
- Ordenación manual de hitos.

Cada uno de ellos, si llega, va en su propia spec.
