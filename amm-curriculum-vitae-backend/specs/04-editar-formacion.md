# SPEC 04 — Edición de Formación (PUT)

> **Estado:** Aprobada
> **Depende de:** SPEC 03 del backend (`03-editar-conocimiento.md`, Implementada) — solo como precedente de patrón, no hay dependencia técnica
> **Fecha:** 2026-08-31
> **Objetivo:** Añadir `PUT /api/formacion/:id` que actualice `titulo`, `institucion`, `descripcion` y `fechaFin` de una formación y devuelva el documento actualizado, con 404 si el id no existe, y añadir ese mismo 404 al `DELETE`.

## Alcance

**Dentro:**

- Nueva función `actualizarFormacion` en `controllers/formacion.js`.
- Nueva ruta `router.put("/:id", actualizarFormacion)` en `routes/formacion.js`, entre el `post("/")` y el `delete`.
- Reemplazo completo de `titulo`, `institucion`, `descripcion` y `fechaFin` con el body recibido.
- Respuesta 200 con la formación actualizada, con el mismo shape que devuelve el `POST` (`titulo`, `institucion`, `descripcion`, `fechaFin`, `id`; sin `_id` ni `__v`, vía el `toJSON` del modelo).
- Respuesta 404 con `{ msg: "Formación no encontrada" }` si el id no corresponde a ninguna formación.
- Respuesta 500 con `{ msg: "Error al actualizar la formación" }` si `save()` falla, incluido el fallo de los `required` y el de una `fechaFin` no parseable.
- Añadir 404 a `deleteFormacion`: comprobar la existencia antes de borrar y devolver `{ msg: "Formación no encontrada" }` si no existe. **La forma de la respuesta 200 no cambia**: sigue siendo `{ msg: "Formación eliminada", formacion: <doc> }`.

**Fuera de alcance (para futuras specs):**

- Todo el frontend (`FormacionCard`, `FormacionForm`, `Formacion.tsx`, `useFormacionStore`). Va en la SPEC 05 del frontend.
- `PUT` de `FormacionComplementaria`: va en la SPEC 05 del backend.
- Endpoints de actualización para `Perfil`.
- `PATCH` parcial: el formulario manda siempre los cuatro campos.
- Validación con `express-validator`: no se usa en ningún controlador del proyecto.
- Cambios en `models/Formacion.js`.
- Cambiar la forma de la respuesta del `DELETE` a `{ msg, id }` como en conocimiento: rompería `deleteFormacion` del hook del frontend, que filtra por `data.formacion.id`.
- Quitar los `console.log` de `crearFormacion` y `deleteFormacion`.
- Impedir formaciones duplicadas: hoy tampoco lo impide el `POST`.
- Ordenar las formaciones por `fechaFin` en el `GET`.

## Modelo de datos

No se introducen colecciones ni campos nuevos. `models/Formacion.js` queda intacto: `titulo` (`String`, `required`, `trim`), `institucion` (`String`, `required`, `trim`), `fechaFin` (`Date`, `required`), `descripcion` (`String`, `trim`, opcional) y el `toJSON` que expone `id`.

Contrato de entrada de `PUT /api/formacion/:id` (body JSON, `express.json()`):

```json
{
  "titulo": "Grado en Ingeniería Informática",
  "institucion": "Universidad de Alicante",
  "descripcion": "Especialidad en Ingeniería del Software",
  "fechaFin": "2020-06-30"
}
```

- `titulo` e `institucion` se guardan tal cual; el `trim: true` del schema los recorta.
- `descripcion` se guarda tal cual, incluida la cadena vacía: no se normaliza a `undefined` ni se borra el campo.
- `fechaFin` viaja en `YYYY-MM-DD` y Mongoose la castea a `Date`; un valor no parseable hace fallar `save()` y responde 500.
- Cualquier campo extra del body se ignora: la asignación es explícita, campo a campo, no `Object.assign(formacion, req.body)`.

Respuesta 200, mismo shape que `POST /api/formacion`:

```json
{
  "titulo": "Grado en Ingeniería Informática",
  "institucion": "Universidad de Alicante",
  "fechaFin": "2020-06-30T00:00:00.000Z",
  "descripcion": "Especialidad en Ingeniería del Software",
  "id": "664a..."
}
```

### Verificación manual (mongosh)

```js
db.formacions.findOne({ _id: ObjectId('<id de la formación>') });
db.formacions.countDocuments();
```

## Plan de implementación

1. Escribir `actualizarFormacion` en `controllers/formacion.js`, siguiendo el estilo de `actualizarConocimiento`: leer `:id` de `req.params`, `Formacion.findById(id)` y devolver 404 con `{ msg: "Formación no encontrada" }` si no existe. Prueba: `PUT` con un ObjectId inexistente responde 404 y no escribe nada.
2. En esa misma función, asignar `titulo`, `institucion`, `descripcion` y `fechaFin` desde `req.body`, hacer `await formacion.save()` y responder `res.json(formacion)`. Envolver todo en `try/catch` con `console.error(error)` y 500 `{ msg: "Error al actualizar la formación" }`. Prueba: `PUT` con los cuatro campos nuevos responde 200 con los valores nuevos y con `id`.
3. Modificar `deleteFormacion` para hacer `Formacion.findById(id)` antes del borrado y devolver 404 con `{ msg: "Formación no encontrada" }` si no existe; si existe, seguir con `findByIdAndDelete` y la respuesta actual `{ msg: "Formación eliminada", formacion: formacionEliminada }`. Prueba: `DELETE` con un id inexistente responde 404 y `DELETE` con un id real sigue respondiendo 200 con la propiedad `formacion`.
4. Exportar `actualizarFormacion` en el `module.exports` del controlador. Prueba: `require("./controllers/formacion").actualizarFormacion` es una función.
5. Registrar la ruta en `routes/formacion.js`: importar `actualizarFormacion` y añadir `router.put("/:id", actualizarFormacion);` entre el `post("/")` y el `delete`. Prueba: el servidor arranca y `PUT /api/formacion/<id>` responde 200.
6. Comprobación end to end: `GET /api/formacion` → `PUT` cambiando los cuatro campos → `GET /api/formacion` y `GET /api/curriculum`, verificando que los valores nuevos aparecen en ambos y que el `id` no ha cambiado.

## Criterios de aceptación

- [ ] `PUT /api/formacion/:id` responde 200 con la formación actualizada.
- [ ] La respuesta del `PUT` tiene el mismo shape que la del `POST`: expone `id`, no expone `_id` ni `__v`.
- [ ] `PUT` con un id inexistente responde 404 con `{ msg: "Formación no encontrada" }` y no modifica ningún documento.
- [ ] `PUT` actualiza los cuatro campos y no altera el `_id`.
- [ ] `PUT` con `descripcion: ""` guarda la cadena vacía y no conserva la descripción anterior.
- [ ] `PUT` sin `titulo` (o sin `institucion`, o sin `fechaFin`) responde 500 por el `required` del modelo y no deja el documento a medias.
- [ ] `PUT` con una `fechaFin` no parseable responde 500 y no modifica el documento.
- [ ] `PUT` con un campo extra en el body (por ejemplo `foo`) lo ignora y no lo guarda en la colección.
- [ ] `titulo` e `institucion` con espacios al principio o al final se guardan recortados.
- [ ] `DELETE /api/formacion/:id` con un id inexistente responde 404 con `{ msg: "Formación no encontrada" }`.
- [ ] `DELETE /api/formacion/:id` con un id real sigue respondiendo 200 con `{ msg, formacion }`, con la misma forma que antes.
- [ ] `GET` y `POST` de `/api/formacion` siguen funcionando igual.
- [ ] `GET /api/curriculum` sigue devolviendo las formaciones con el mismo shape.

## Decisiones

- **Sí:** `PUT` con reemplazo completo, en vez de `PATCH` parcial. El formulario manda siempre los cuatro campos; un `PATCH` añadiría lógica de "campo presente o ausente" sin consumidor. Mismo criterio que las SPEC 02 y 03.
- **Sí:** `findById` + asignación + `save()`, en vez de `findByIdAndUpdate`. `save()` dispara las validaciones `required` con la configuración por defecto y el patrón coincide con `actualizarConocimiento`.
- **Sí:** asignar campo a campo en lugar de `Object.assign(formacion, req.body)`. Evita que un body malicioso o descuidado escriba campos que no son del contrato.
- **Sí:** guardar `descripcion` tal cual llegue, incluida la cadena vacía. Es un campo opcional sin `required`; vaciarlo es una edición legítima y normalizarlo añadiría un condicional que ningún otro controlador tiene.
- **Sí:** añadir el 404 al `DELETE`. Hoy borrar un id inexistente responde 200 con `formacion: null` y el hook del frontend filtra por `data.formacion.id`, que reventaría; el `PUT` ya obliga a escribir esa comprobación en el mismo fichero.
- **No:** cambiar la forma de la respuesta del `DELETE` a `{ msg, id }` como en conocimiento. Rompería `deleteFormacion` del hook del frontend sin aportar nada a la edición; la uniformidad de los `DELETE` merece su propia spec.
- **No:** validar los campos a mano para devolver 400. Ningún controlador del proyecto valida hoy; el `required` del modelo ya impide el dato malo y el único consumidor es un formulario con `required` en los inputs.
- **No:** tocar `models/Formacion.js`. El schema ya cubre el contrato.

## Riesgos

| Riesgo                                                                                        | Mitigación                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El frontend manda `fechaFin` como `""` al editar y el `required` hace fallar el `save()`      | El input `type="date"` es `required` en el formulario y la SPEC 05 del frontend rellena la fecha con `.slice(0, 10)`; hay criterio de aceptación de que un `PUT` sin `fechaFin` responde 500 y no corrompe nada. |
| Un `:id` con formato no válido de ObjectId hace que `findById` lance y devuelva 500, no 404   | Aceptado: es el mismo comportamiento de `actualizarConocimiento` y `actualizarExperiencia`. La ruta solo la consume el frontend, con ids venidos del propio `GET`.                                               |
| El cambio en `deleteFormacion` rompe el borrado desde el frontend                             | La respuesta 200 conserva la propiedad `formacion`, de la que depende el hook, con criterio de aceptación propio.                                                                                                |
| `Object.assign` accidental deja campos basura en la colección                                 | Se asignan los cuatro campos explícitamente, con criterio de aceptación para el campo extra.                                                                                                                     |
| Editar una formación deja `descripcion` con la cadena vacía y la card pinta un bloque vacío   | `FormacionCard` ya renderiza la descripción solo si es truthy (`descripcion && ...`), así que la cadena vacía no pinta nada.                                                                                     |
