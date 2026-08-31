# SPEC 05 — Edición de Formación Complementaria (PUT)

> **Estado:** Aprobada
> **Depende de:** SPEC 04 del backend (`04-editar-formacion.md`, Borrador) — solo como precedente de patrón, no hay dependencia técnica
> **Fecha:** 2026-08-31
> **Objetivo:** Añadir `PUT /api/formacionComplementaria/:id` que actualice `titulo` e `institucion` de una formación complementaria y devuelva el documento actualizado, con 404 si el id no existe, y añadir ese mismo 404 al `DELETE`.

## Alcance

**Dentro:**

- Nueva función `actualizarFormacionComplementaria` en `controllers/formacionComplementaria.js`.
- Nueva ruta `router.put("/:id", actualizarFormacionComplementaria)` en `routes/formacionComplementaria.js`, entre el `post("/")` y el `delete`.
- Reemplazo completo de `titulo` e `institucion` con el body recibido.
- Respuesta 200 con la formación complementaria actualizada, con el mismo shape que devuelve el `POST` (`titulo`, `institucion`, `id`; sin `_id` ni `__v`, vía el `toJSON` del modelo).
- Respuesta 404 con `{ msg: "Formación complementaria no encontrada" }` si el id no corresponde a ningún documento.
- Respuesta 500 con `{ msg: "Error al actualizar la formación complementaria" }` si `save()` falla, incluido el fallo de los `required`.
- Añadir 404 a `deleteFormacionComplementaria`: comprobar la existencia antes de borrar y devolver `{ msg: "Formación complementaria no encontrada" }` si no existe. **La forma de la respuesta 200 no cambia**: sigue siendo `{ msg: "Formación eliminada", formacionComplementaria: <doc> }`.

**Fuera de alcance (para futuras specs):**

- Todo el frontend (`FormacionComplementariaCard`, `FormacionComplementariaForm`, `FormacionComplementaria.tsx`, `useFormacionComplementariaStore`). Va en la SPEC 06 del frontend.
- `PUT` de `Formacion`: va en la SPEC 04 del backend.
- Endpoints de actualización para `Perfil`.
- `PATCH` parcial: el formulario manda siempre los dos campos.
- Validación con `express-validator`: no se usa en ningún controlador del proyecto.
- Cambios en `models/FormacionComplementaria.js`.
- Cambiar la forma de la respuesta del `DELETE` a `{ msg, id }` como en conocimiento: rompería `deleteFormacionComplementaria` del hook del frontend, que filtra por `data.formacionComplementaria.id`.
- Corregir el `msg` del `DELETE` (`"Formación eliminada"`, sin el "complementaria"): cambiarlo no aporta nada al frontend, que no lo lee.
- Quitar el `console.log` de `deleteFormacionComplementaria`.
- Unificar la ruta a `kebab-case` (`/api/formacion-complementaria`): rompería el frontend y el `curriculum`.
- Impedir títulos duplicados: hoy tampoco lo impide el `POST`.

## Modelo de datos

No se introducen colecciones ni campos nuevos. `models/FormacionComplementaria.js` queda intacto: `titulo` (`String`, `required`, `trim`), `institucion` (`String`, `required`, `trim`) y el `toJSON` que expone `id`.

Contrato de entrada de `PUT /api/formacionComplementaria/:id` (body JSON, `express.json()`):

```json
{
  "titulo": "Curso de React avanzado",
  "institucion": "Platzi"
}
```

- `titulo` e `institucion` se guardan tal cual; el `trim: true` del schema los recorta.
- Cualquier campo extra del body se ignora: la asignación es explícita, campo a campo, no `Object.assign(formacion, req.body)`.

Respuesta 200, mismo shape que `POST /api/formacionComplementaria`:

```json
{
  "titulo": "Curso de React avanzado",
  "institucion": "Platzi",
  "id": "664a..."
}
```

### Verificación manual (mongosh)

```js
db.formacioncomplementarias.findOne({
  _id: ObjectId('<id de la formación complementaria>'),
});
db.formacioncomplementarias.countDocuments();
```

## Plan de implementación

1. Escribir `actualizarFormacionComplementaria` en `controllers/formacionComplementaria.js`, siguiendo el estilo de `actualizarConocimiento`: leer `:id` de `req.params`, `FormacionComplementaria.findById(id)` y devolver 404 con `{ msg: "Formación complementaria no encontrada" }` si no existe. Prueba: `PUT` con un ObjectId inexistente responde 404 y no escribe nada.
2. En esa misma función, asignar `titulo` e `institucion` desde `req.body`, hacer `await formacionComplementaria.save()` y responder `res.json(formacionComplementaria)`. Envolver todo en `try/catch` con `console.error(error)` y 500 `{ msg: "Error al actualizar la formación complementaria" }`. Prueba: `PUT` con `titulo` e `institucion` nuevos responde 200 con los valores nuevos y con `id`.
3. Modificar `deleteFormacionComplementaria` para hacer `FormacionComplementaria.findById(id)` antes del borrado y devolver 404 con `{ msg: "Formación complementaria no encontrada" }` si no existe; si existe, seguir con `findByIdAndDelete` y la respuesta actual `{ msg: "Formación eliminada", formacionComplementaria: <doc> }`. Prueba: `DELETE` con un id inexistente responde 404 y `DELETE` con un id real sigue respondiendo 200 con la propiedad `formacionComplementaria`.
4. Exportar `actualizarFormacionComplementaria` en el `module.exports` del controlador. Prueba: `require("./controllers/formacionComplementaria").actualizarFormacionComplementaria` es una función.
5. Registrar la ruta en `routes/formacionComplementaria.js`: importar `actualizarFormacionComplementaria` y añadir `router.put("/:id", actualizarFormacionComplementaria);` entre el `post("/")` y el `delete`. Prueba: el servidor arranca y `PUT /api/formacionComplementaria/<id>` responde 200.
6. Comprobación end to end: `GET /api/formacionComplementaria` → `PUT` cambiando los dos campos → `GET /api/formacionComplementaria` y `GET /api/curriculum`, verificando que los valores nuevos aparecen en ambos y que el `id` no ha cambiado.

## Criterios de aceptación

- [ ] `PUT /api/formacionComplementaria/:id` responde 200 con el documento actualizado.
- [ ] La respuesta del `PUT` tiene el mismo shape que la del `POST`: expone `id`, no expone `_id` ni `__v`.
- [ ] `PUT` con un id inexistente responde 404 con `{ msg: "Formación complementaria no encontrada" }` y no modifica ningún documento.
- [ ] `PUT` actualiza `titulo` e `institucion` y no altera el `_id`.
- [ ] `PUT` sin `titulo` (o sin `institucion`) responde 500 por el `required` del modelo y no deja el documento a medias.
- [ ] `PUT` con un campo extra en el body (por ejemplo `foo`) lo ignora y no lo guarda en la colección.
- [ ] `titulo` e `institucion` con espacios al principio o al final se guardan recortados.
- [ ] `DELETE /api/formacionComplementaria/:id` con un id inexistente responde 404.
- [ ] `DELETE /api/formacionComplementaria/:id` con un id real sigue respondiendo 200 con `{ msg, formacionComplementaria }`, con la misma forma que antes.
- [ ] `GET` y `POST` de `/api/formacionComplementaria` siguen funcionando igual.
- [ ] `GET /api/curriculum` sigue devolviendo las formaciones complementarias con el mismo shape.
- [ ] Los endpoints de `/api/formacion` no cambian de comportamiento.

## Decisiones

- **Sí:** spec separada de la SPEC 04 aunque el patrón sea idéntico. Son dos modelos, dos controladores y dos rutas distintas, y así cada una se puede implementar y revisar por separado, como se hizo con experiencia y conocimiento.
- **Sí:** `PUT` con reemplazo completo, en vez de `PATCH` parcial. Solo hay dos campos y el formulario los manda siempre los dos.
- **Sí:** `findById` + asignación + `save()`, en vez de `findByIdAndUpdate`. `save()` dispara los `required` con la configuración por defecto y el patrón coincide con `actualizarConocimiento`.
- **Sí:** asignar campo a campo en lugar de `Object.assign`. Evita que un body malicioso o descuidado escriba campos que no son del contrato.
- **Sí:** mensaje de 404 con "complementaria" explícito, aunque el `msg` del `DELETE` diga solo `"Formación eliminada"`. El mensaje nuevo se escribe bien desde el principio; corregir el viejo cambiaría una respuesta existente sin consumidor.
- **Sí:** añadir el 404 al `DELETE`. Hoy borrar un id inexistente responde 200 con `formacionComplementaria: null` y el hook del frontend filtra por `data.formacionComplementaria.id`, que reventaría.
- **No:** cambiar la forma de la respuesta del `DELETE` a `{ msg, id }`. Rompería el hook del frontend sin aportar nada a la edición.
- **No:** renombrar la ruta a `kebab-case`. La consume el frontend y el agregador de `curriculum`; es un cambio de contrato ajeno a esta spec.
- **No:** validar a mano para devolver 400. Ningún controlador del proyecto valida hoy y los `required` del modelo ya impiden el dato malo.

## Riesgos

| Riesgo                                                                                       | Mitigación                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Un `:id` con formato no válido de ObjectId hace que `findById` lance y devuelva 500, no 404  | Aceptado: mismo comportamiento que el resto de controladores. La ruta solo la consume el frontend, con ids venidos del propio `GET`.                                |
| El cambio en `deleteFormacionComplementaria` rompe el borrado desde el frontend               | La respuesta 200 conserva la propiedad `formacionComplementaria`, de la que depende el hook, con criterio de aceptación propio.                                     |
| `Object.assign` accidental deja campos basura en la colección                                 | Se asignan `titulo` e `institucion` explícitamente, con criterio de aceptación para el campo extra.                                                                 |
| Implementar esta spec y la 04 a la vez provoca conflictos entre ramas                         | Son ficheros disjuntos (`formacionComplementaria.*` frente a `formacion.*`); solo coinciden en el patrón, no en el código.                                          |
