# SPEC 03 — Edición de Conocimiento (PUT)

> **Estado:** Implementada
> **Depende de:** SPEC 02 del backend (`02-editar-experiencia.md`, Implementada) — solo como precedente de patrón, no hay dependencia técnica
> **Fecha:** 2026-08-31
> **Objetivo:** Añadir `PUT /api/conocimiento/:id` que actualice `titulo` y `nivel` de un conocimiento y devuelva el documento actualizado, con 404 si el id no existe.

## Alcance

**Dentro:**

- Nueva función `actualizarConocimiento` en `controllers/conocimiento.js`.
- Nueva ruta `router.put("/:id", actualizarConocimiento)` en `routes/conocimiento.js`, entre el `post("/multiple")` y el `delete`.
- Reemplazo completo de `titulo` y `nivel` con el body recibido.
- Respuesta 200 con el conocimiento actualizado, con el mismo shape que devuelve el `POST` (`id`, `titulo`, `nivel`; sin `_id` ni `__v`, vía el `toJSON` del modelo).
- Respuesta 404 con `{ msg: "Conocimiento no encontrado" }` si el id no corresponde a ningún conocimiento.
- Respuesta 500 con `{ msg: "Error al actualizar el conocimiento" }` si `save()` falla, incluido el fallo del `enum` de `nivel`.

**Fuera de alcance (para futuras specs):**

- Todo el frontend (`ConocimientoCard`, `ConocimientoForm`, `Conocimiento.tsx`, `useConocimientoStore`). Va en la SPEC 04 del frontend.
- Borrar `crearConocimientos` (`POST /api/conocimiento/multiple`): es código muerto en el frontend, pero funcional y coherente con el modelo, a diferencia de `actualizarConocimientos` de la SPEC 02, que estaba roto. Su limpieza va aparte.
- `PATCH` parcial: el formulario manda siempre los dos campos.
- Validación con `express-validator`: no se usa en ningún controlador del proyecto.
- Endpoints de actualización para `Formacion`, `FormacionComplementaria` y `Perfil`.
- Comprobar si el conocimiento está referenciado en `Experiencia.tecnologias` al editarlo: editar solo cambia texto, el `_id` no se toca y las referencias siguen siendo válidas.
- Cambios en `models/Conocimiento.js`, incluido el `enum` de `nivel`.
- Impedir títulos duplicados: hoy tampoco lo impide el `POST`.

## Modelo de datos

No se introducen colecciones ni campos nuevos. `models/Conocimiento.js` queda intacto, con su `enum` de `nivel` en `["Básico", "Intermedio", "Avanzado"]` y su `toJSON` que expone `id`.

Contrato de entrada de `PUT /api/conocimiento/:id` (body JSON, `express.json()`):

```json
{
  "titulo": "React",
  "nivel": "Avanzado"
}
```

- `titulo` se guarda tal cual; el `trim: true` del schema lo recorta.
- `nivel` debe ser uno de los tres valores del `enum`; cualquier otro hace fallar `save()` y responde 500.
- Cualquier campo extra del body se ignora: la asignación es explícita, campo a campo, no `Object.assign(conocimiento, req.body)`.

Respuesta 200, mismo shape que `POST /api/conocimiento`:

```json
{
  "titulo": "React",
  "nivel": "Avanzado",
  "id": "664a..."
}
```

### Verificación manual (mongosh)

```js
db.conocimientos.findOne({ _id: ObjectId('<id del conocimiento>') });
db.experiencias.find({ tecnologias: ObjectId('<id del conocimiento>') });
```

## Plan de implementación

1. Escribir `actualizarConocimiento` en `controllers/conocimiento.js`, siguiendo el estilo de `eliminarConocimiento`: leer `:id` de `req.params`, `Conocimiento.findById(id)` y devolver 404 con `{ msg: "Conocimiento no encontrado" }` si no existe. Prueba: `PUT` con un ObjectId inexistente responde 404 y no escribe nada.
2. En esa misma función, asignar `titulo` y `nivel` desde `req.body`, hacer `await conocimiento.save()` y responder `res.json(conocimiento)`. Envolver todo en `try/catch` con `console.error(error)` y 500 `{ msg: "Error al actualizar el conocimiento" }`. Prueba: `PUT` con `titulo` y `nivel` nuevos responde 200 con los valores nuevos y con `id`.
3. Exportar `actualizarConocimiento` en el `module.exports` del controlador. Prueba: `require("./controllers/conocimiento").actualizarConocimiento` es una función.
4. Registrar la ruta en `routes/conocimiento.js`: importar `actualizarConocimiento` y añadir `router.put("/:id", actualizarConocimiento);` entre el `post("/multiple")` y el `delete`. Prueba: el servidor arranca y `PUT /api/conocimiento/<id>` responde 200.
5. Comprobación end to end con un conocimiento real referenciado en una experiencia: `GET /api/conocimiento` → `PUT` cambiando `titulo` y `nivel` → `GET /api/conocimiento` y `GET /api/experiencia`, verificando que el título nuevo aparece y que `tecnologias` de la experiencia sigue conteniendo el mismo id.

## Criterios de aceptación

- [ ] `PUT /api/conocimiento/:id` responde 200 con el conocimiento actualizado.
- [ ] La respuesta del `PUT` tiene el mismo shape que la del `POST`: expone `id`, no expone `_id` ni `__v`.
- [ ] `PUT` con un id inexistente responde 404 con `{ msg: "Conocimiento no encontrado" }` y no modifica ningún documento.
- [ ] `PUT` que cambia solo `titulo` conserva el `nivel` enviado en el body y no altera el `_id`.
- [ ] `PUT` con un `nivel` fuera del `enum` responde 500 y no modifica el documento.
- [ ] `PUT` con un campo extra en el body (por ejemplo `foo`) lo ignora y no lo guarda en la colección.
- [ ] `titulo` con espacios al principio o al final se guarda recortado.
- [ ] Editar un conocimiento referenciado en `Experiencia.tecnologias` no cambia su `_id`, y `GET /api/experiencia` sigue devolviendo ese id en `tecnologias`.
- [ ] `GET`, `POST`, `POST /multiple` y `DELETE` de `/api/conocimiento` siguen funcionando igual.

## Decisiones

- **Sí:** `PUT` con reemplazo completo, en vez de `PATCH` parcial. Solo hay dos campos y el formulario los manda siempre los dos; un `PATCH` añadiría lógica de "campo presente o ausente" sin consumidor. Mismo criterio que la SPEC 02.
- **Sí:** `findById` + asignación + `save()`, en vez de `findByIdAndUpdate`. `save()` dispara la validación del `enum` de `nivel` con la configuración por defecto; `findByIdAndUpdate` no la ejecuta salvo con `runValidators: true`, y el patrón coincide con `actualizarExperiencia`.
- **Sí:** asignar campo a campo en lugar de `Object.assign(conocimiento, req.body)`. Evita que un body malicioso o descuidado escriba campos que no son del contrato.
- **Sí:** 404 con el mismo mensaje y forma que `eliminarConocimiento`. El frontend ya trata los errores del hook por igual y no merece un formato nuevo.
- **No:** validar `nivel` a mano para devolver 400. Ningún controlador del proyecto valida hoy; el `enum` del modelo ya impide el dato malo y el único consumidor es un `<select>` con las tres opciones fijas.
- **No:** borrar `crearConocimientos`. Es código muerto en el frontend, pero funciona y no contradice el modelo; se borró `actualizarConocimientos` en la SPEC 02 porque escribía sobre un campo inexistente y habría fallado siempre.
- **No:** tocar el `enum` del modelo para aceptar minúsculas. El desajuste está en el enum de TypeScript del frontend y se corrige allí, en la SPEC 04.
- **No:** transacciones ni comprobaciones cruzadas con `Experiencia`. La edición no cambia ids, así que ninguna referencia queda huérfana.

## Riesgos

| Riesgo                                                                                       | Mitigación                                                                                                                                                          |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El frontend manda `nivel` en minúsculas (`"basico"`) y el `enum` hace fallar el `save()`     | La SPEC 04 alinea `ConocimientoNivel` con los valores del modelo. En el backend hay criterio de aceptación de que un `nivel` inválido responde 500 y no corrompe nada. |
| Un `:id` con formato no válido de ObjectId hace que `findById` lance y devuelva 500, no 404  | Aceptado: es el mismo comportamiento de `eliminarConocimiento` y `actualizarExperiencia`. La ruta solo la consume el frontend, con ids venidos del propio `GET`.       |
| `Object.assign` accidental deja campos basura en la colección                                | Se asignan `titulo` y `nivel` explícitamente, con criterio de aceptación propio para el campo extra.                                                                   |
| Editar un conocimiento rompe las tecnologías mostradas en las cards de Experiencia           | La edición no altera el `_id`; hay criterio de aceptación que lo verifica y el paso 5 lo comprueba end to end.                                                        |
