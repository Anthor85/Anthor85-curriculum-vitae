# SPEC 12 — Extras asociados a Formación

> **Estado:** Implementada
> **Depende de:** SPEC 01 (`01-hitos-experiencia.md`), cuyo patrón replica; SPEC 04 (`04-editar-formacion.md`)
> **Fecha:** 2026-10-23
> **Objetivo:** Sustituir el campo `descripcion` de `Formacion` por N `extras`, guardados en una colección `extras` con referencia a la formación, igual que `hitos` con `Experiencia`.

## Alcance

**Dentro:**

- Nuevo modelo `models/Extra.js` con `descripcion` (String) y `formacion` (ObjectId, ref `Formacion`).
- `models/Formacion.js` pierde `descripcion` y gana el virtual `extras`.
- `GET /api/formacion`, `POST`, `PUT` y `GET /api/curriculum` devuelven cada formación con `extras` poblado.
- `POST` crea los extras; `PUT` los reconcilia por id; `DELETE` los borra en cascada y devuelve `extrasEliminados`.
- La lógica de normalizar, crear y reconciliar se extrae a `helpers/descripcionesHijas.js`, compartida con los hitos.
- `scripts/clonarBBDD.js` copia también `Extra`.
- Migración de las `descripcion` existentes.

**Fuera de alcance:** orden manual de los extras; endpoints propios `/api/extra`.

## Contrato

Body de `POST`/`PUT /api/formacion`:

```json
{
  "titulo": "Grado en Informática",
  "institucion": "Universidad de Valencia",
  "fechaFin": "2015-06-30",
  "extras": [{ "id": "<opcional>", "descripcion": "Rama de software" }]
}
```

Mismas reglas que los hitos: se descartan descripciones vacías o de solo espacios; en `POST` se ignoran los id; en `PUT` un id que no pertenezca a la formación se descarta y se crea un extra nuevo.

## Migración de datos

Ejecutar en cada base (desarrollo y producción) **antes** de desplegar:

```js
// mongosh
db.extras.createIndex({ formacion: 1 });

db.formacions
  .find({ descripcion: { $exists: true, $nin: [null, ''] } })
  .forEach((f) => {
    db.extras.insertOne({
      descripcion: f.descripcion.trim(),
      formacion: f._id,
    });
  });

db.formacions.updateMany({}, { $unset: { descripcion: '' } });
```

Verificación:

```js
db.formacions.countDocuments({ descripcion: { $exists: true } }); // 0
db.extras.countDocuments({
  formacion: { $nin: db.formacions.distinct('_id') },
}); // 0
```

## Criterios de aceptación

- [x] `GET /api/formacion` devuelve `extras` (vacío si no tiene), sin `descripcion`.
- [x] Cada extra expone `id`, `descripcion` y `formacion`, sin `_id` ni `__v`.
- [x] `PUT` conserva, crea y borra extras según los recibidos.
- [x] `DELETE` borra en cascada solo los extras de esa formación.
- [x] `GET /api/curriculum` devuelve las formaciones con extras poblados.
- [x] Los tests de experiencia siguen pasando tras extraer el helper.
