# SPEC 05 — Edición de Formación Complementaria (PUT)

> **Estado:** Implementada
> **Depende de:** SPEC 04 del backend (`04-editar-formacion.md`, Borrador) — solo como precedente de patrón, no hay dependencia técnica
> **Fecha:** 2026-08-31
> **Objetivo:** Añadir `PUT /api/formacionComplementaria/:id` que actualice `titulo`, `institucion` y `fechaFin` de una formación complementaria y devuelva el documento actualizado, con 404 si el id no existe, y añadir ese mismo 404 al `DELETE`. Se añade además el campo **opcional** `fechaFin` al modelo, al `POST` y al `PUT`.

## Alcance

**Dentro:**

- Nueva función `actualizarFormacionComplementaria` en `controllers/formacionComplementaria.js`.
- Nueva ruta `router.put("/:id", actualizarFormacionComplementaria)` en `routes/formacionComplementaria.js`, entre el `post("/")` y el `delete`.
- Nuevo campo **opcional** `fechaFin` (`Date`, sin `required`) en `models/FormacionComplementaria.js`.
- `crearFormacionComplementaria` pasa a leer y guardar `fechaFin` del body.
- Reemplazo completo de `titulo`, `institucion` y `fechaFin` con el body recibido.
- Respuesta 200 con la formación complementaria actualizada, con el mismo shape que devuelve el `POST` (`titulo`, `institucion`, `fechaFin` si lo tiene, `id`; sin `_id` ni `__v`, vía el `toJSON` del modelo).
- Respuesta 404 con `{ msg: "Formación complementaria no encontrada" }` si el id no corresponde a ningún documento.
- Respuesta 500 con `{ msg: "Error al actualizar la formación complementaria" }` si `save()` falla, incluido el fallo de los `required`.
- Añadir 404 a `deleteFormacionComplementaria`: comprobar la existencia antes de borrar y devolver `{ msg: "Formación complementaria no encontrada" }` si no existe. **La forma de la respuesta 200 no cambia**: sigue siendo `{ msg: "Formación eliminada", formacionComplementaria: <doc> }`.

**Fuera de alcance (para futuras specs):**

- Todo el frontend (`FormacionComplementariaCard`, `FormacionComplementariaForm`, `FormacionComplementaria.tsx`, `useFormacionComplementariaStore`). Va en la SPEC 06 del frontend.
- `PUT` de `Formacion`: va en la SPEC 04 del backend.
- Endpoints de actualización para `Perfil`.
- `PATCH` parcial: el formulario manda siempre los dos campos.
- Validación con `express-validator`: no se usa en ningún controlador del proyecto.
- Cambiar la forma de la respuesta del `DELETE` a `{ msg, id }` como en conocimiento: rompería `deleteFormacionComplementaria` del hook del frontend, que filtra por `data.formacionComplementaria.id`.
- Corregir el `msg` del `DELETE` (`"Formación eliminada"`, sin el "complementaria"): cambiarlo no aporta nada al frontend, que no lo lee.
- Mostrar o editar `fechaFin` en el frontend: va en la SPEC 06 del frontend.
- Hacer `fechaFin` obligatorio o migrar los documentos existentes para rellenarlo.
- Quitar el `console.log` de `deleteFormacionComplementaria`.
- Unificar la ruta a `kebab-case` (`/api/formacion-complementaria`): rompería el frontend y el `curriculum`.
- Impedir títulos duplicados: hoy tampoco lo impide el `POST`.

## Modelo de datos

No se introducen colecciones nuevas. En `models/FormacionComplementaria.js` se añade un campo opcional `fechaFin`, junto a los ya existentes `titulo` (`String`, `required`, `trim`), `institucion` (`String`, `required`, `trim`) y el `toJSON` que expone `id`:

```js
fechaFin: {
  type: Date,
},
```

- Sin `required`: las formaciones complementarias ya guardadas siguen siendo válidas sin tocarlas.
- `Date`, igual que el `fechaFin` de `models/Formacion.js`, para que ambos modelos serialicen la fecha igual (ISO 8601 en el JSON).
- **No hace falta migración**: MongoDB no impone esquema, así que los documentos existentes simplemente no tienen la clave `fechaFin` y las lecturas la devuelven `undefined`.

Contrato de entrada de `POST` y `PUT /api/formacionComplementaria/:id` (body JSON, `express.json()`):

```json
{
  "titulo": "Curso de React avanzado",
  "institucion": "Platzi",
  "fechaFin": "2025-06-30"
}
```

- `titulo` e `institucion` se guardan tal cual; el `trim: true` del schema los recorta.
- `fechaFin` es opcional. Se acepta cualquier valor que mongoose sepa castear a `Date` (el `"YYYY-MM-DD"` que manda un `<input type="date">` incluido).
- `fechaFin` ausente, `null` o `""` se normaliza a `undefined` antes de asignarlo: en el `POST` el documento se crea sin la clave y en el `PUT` mongoose hace `$unset` del campo al guardar. Así se puede *quitar* una fecha ya puesta, y una cadena vacía no revienta el casteo a `Date`.
- Cualquier campo extra del body se ignora: la asignación es explícita, campo a campo, no `Object.assign(formacion, req.body)`.

Respuesta 200, mismo shape que `POST /api/formacionComplementaria`:

```json
{
  "titulo": "Curso de React avanzado",
  "institucion": "Platzi",
  "fechaFin": "2025-06-30T00:00:00.000Z",
  "id": "664a..."
}
```

Si el documento no tiene `fechaFin`, la propiedad no aparece en la respuesta.

### Verificación manual (mongosh)

```js
db.formacioncomplementarias.findOne({
  _id: ObjectId('<id de la formación complementaria>'),
});
db.formacioncomplementarias.countDocuments();

// documentos que ya tienen fecha y documentos heredados sin ella
db.formacioncomplementarias.countDocuments({ fechaFin: { $exists: true } });
db.formacioncomplementarias.countDocuments({ fechaFin: { $exists: false } });
```

## Plan de implementación

0. Añadir el campo opcional `fechaFin: { type: Date }` a `models/FormacionComplementaria.js` y leerlo en `crearFormacionComplementaria` (`const { titulo, institucion, fechaFin } = req.body;`), pasándolo al constructor como `fechaFin: fechaFin || undefined`. Prueba: un `POST` con `fechaFin` guarda la fecha; un `POST` sin `fechaFin` (o con `""`) sigue respondiendo 201 y el documento se crea sin la clave.
1. Escribir `actualizarFormacionComplementaria` en `controllers/formacionComplementaria.js`, siguiendo el estilo de `actualizarConocimiento`: leer `:id` de `req.params`, `FormacionComplementaria.findById(id)` y devolver 404 con `{ msg: "Formación complementaria no encontrada" }` si no existe. Prueba: `PUT` con un ObjectId inexistente responde 404 y no escribe nada.
2. En esa misma función, asignar `titulo` e `institucion` desde `req.body` y `fechaFin` como `req.body.fechaFin || undefined`, hacer `await formacionComplementaria.save()` y responder `res.json(formacionComplementaria)`. Envolver todo en `try/catch` con `console.error(error)` y 500 `{ msg: "Error al actualizar la formación complementaria" }`. Prueba: `PUT` con `titulo` e `institucion` nuevos responde 200 con los valores nuevos y con `id`.
3. Modificar `deleteFormacionComplementaria` para hacer `FormacionComplementaria.findById(id)` antes del borrado y devolver 404 con `{ msg: "Formación complementaria no encontrada" }` si no existe; si existe, seguir con `findByIdAndDelete` y la respuesta actual `{ msg: "Formación eliminada", formacionComplementaria: <doc> }`. Prueba: `DELETE` con un id inexistente responde 404 y `DELETE` con un id real sigue respondiendo 200 con la propiedad `formacionComplementaria`.
4. Exportar `actualizarFormacionComplementaria` en el `module.exports` del controlador. Prueba: `require("./controllers/formacionComplementaria").actualizarFormacionComplementaria` es una función.
5. Registrar la ruta en `routes/formacionComplementaria.js`: importar `actualizarFormacionComplementaria` y añadir `router.put("/:id", actualizarFormacionComplementaria);` entre el `post("/")` y el `delete`. Prueba: el servidor arranca y `PUT /api/formacionComplementaria/<id>` responde 200.
6. Comprobación end to end: `GET /api/formacionComplementaria` → `PUT` cambiando los tres campos → `PUT` con `fechaFin: ""` para quitarla → `GET /api/formacionComplementaria` y `GET /api/curriculum`, verificando que los valores nuevos aparecen en ambos, que `fechaFin` desaparece del JSON al vaciarla y que el `id` no ha cambiado.

## Criterios de aceptación

- [ ] `PUT /api/formacionComplementaria/:id` responde 200 con el documento actualizado.
- [ ] La respuesta del `PUT` tiene el mismo shape que la del `POST`: expone `id`, no expone `_id` ni `__v`.
- [ ] `PUT` con un id inexistente responde 404 con `{ msg: "Formación complementaria no encontrada" }` y no modifica ningún documento.
- [ ] `PUT` actualiza `titulo`, `institucion` y `fechaFin` y no altera el `_id`.
- [ ] `POST` con `fechaFin` guarda la fecha y la devuelve en la respuesta 201.
- [ ] `POST` sin `fechaFin` sigue respondiendo 201 y el documento se crea sin esa clave.
- [ ] `PUT` con `fechaFin` sobre un documento que no la tenía se la añade.
- [ ] `PUT` con `fechaFin` vacío (`""` o ausente) sobre un documento que sí la tenía la elimina, y la respuesta ya no incluye la propiedad.
- [ ] `GET /api/formacionComplementaria` sigue devolviendo 200 con los documentos antiguos que no tienen `fechaFin`.
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
- **Sí:** `fechaFin` opcional (`Date`, sin `required`). Muchos cursos y certificaciones no tienen fecha de fin registrada, y hacerlo obligatorio invalidaría los documentos que ya están en la colección.
- **Sí:** `Date` en vez de `String`, igual que `models/Formacion.js`, para que el frontend pueda reutilizar `dateConverter` sin ramas especiales.
- **Sí:** normalizar `"" | null | undefined` a `undefined` antes de asignar. Con `Date`, la cadena vacía que manda un `<input type="date">` sin rellenar fallaría al castear y devolvería un 500; además así se puede borrar una fecha ya guardada (mongoose hace `$unset`).
- **No:** migración de los documentos existentes. MongoDB no impone esquema y el campo es opcional: los documentos antiguos siguen leyéndose y validándose sin tocar nada.
- **No:** validar a mano para devolver 400. Ningún controlador del proyecto valida hoy y los `required` del modelo ya impiden el dato malo.

## Riesgos

| Riesgo                                                                                       | Mitigación                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Un `:id` con formato no válido de ObjectId hace que `findById` lance y devuelva 500, no 404  | Aceptado: mismo comportamiento que el resto de controladores. La ruta solo la consume el frontend, con ids venidos del propio `GET`.                                |
| El cambio en `deleteFormacionComplementaria` rompe el borrado desde el frontend               | La respuesta 200 conserva la propiedad `formacionComplementaria`, de la que depende el hook, con criterio de aceptación propio.                                     |
| `Object.assign` accidental deja campos basura en la colección                                 | Se asignan `titulo` e `institucion` explícitamente, con criterio de aceptación para el campo extra.                                                                 |
| Un `fechaFin` con formato no casteable a `Date` hace que `save()` falle y devuelva 500                        | Aceptado, mismo trato que los `required`. El frontend solo manda el `"YYYY-MM-DD"` de un `<input type="date">`.                                                     |
| El frontend actual revienta al recibir un campo `fechaFin` que no espera                                      | El campo es aditivo: `FormacionComplementariaCard` desestructura solo `titulo` e `institucion` y `fechaFin` se ignora hasta la SPEC 06 del frontend.                |
| `PUT` desde un consumidor viejo que no manda `fechaFin` borra la fecha guardada                               | Es el comportamiento buscado del `PUT` con reemplazo completo; el único consumidor es el formulario, que mandará siempre el campo.                                  |
| Implementar esta spec y la 04 a la vez provoca conflictos entre ramas                         | Son ficheros disjuntos (`formacionComplementaria.*` frente a `formacion.*`); solo coinciden en el patrón, no en el código.                                          |
