# SPEC 02 — Edición de Experiencia (PUT)

> **Estado:** Implementada
> **Depende de:** SPEC 01 del backend (`01-hitos-experiencia.md`, Implementada)
> **Fecha:** 2026-08-28
> **Objetivo:** Añadir `PUT /api/experiencia/:id` que actualice los campos de una experiencia y reconcilie sus hitos por id (actualizar los que llegan con id, crear los que no lo llevan, borrar los ausentes), y eliminar la función muerta `actualizarConocimientos`.

## Alcance

**Dentro:**

- Nueva función `actualizarExperiencia` en `controllers/experiencia.js`.
- Nueva ruta `router.put("/:id", actualizarExperiencia)` en `routes/experiencia.js`.
- Reconciliación de hitos por id dentro del PUT: actualizar, crear y borrar.
- Helper `normalizarHitos()` compartido por `crearExperiencia` y `actualizarExperiencia`, que acepta tanto el formato antiguo (array de strings) como el nuevo (array de `{ id?, descripcion }`).
- Respuesta 200 con la experiencia actualizada y sus hitos poblados, con el mismo shape que devuelve el POST.
- Respuesta 404 si el id no corresponde a ninguna experiencia.
- Eliminación de la función `actualizarConocimientos` y de su entrada en `module.exports`.

**Fuera de alcance (para futuras specs):**

- Todo el frontend (`ExperienciaCard`, `ExperienciaForm`, `Experiencia.tsx`, `useExperienciaStore`). Va en la SPEC 03 del frontend.
- Endpoints propios `/api/hito` (CRUD independiente de hitos).
- `PATCH` parcial: el form siempre manda el objeto completo.
- Orden manual de los hitos dentro de una experiencia.
- Endpoints de actualización para `Formacion`, `FormacionComplementaria`, `Conocimiento` y `Perfil`.
- Validación con `express-validator` de los campos de Experiencia: hoy no se usa en ningún controlador del proyecto.
- Transacciones: `Experiencia.save()` y las escrituras de `Hito` no son atómicas entre sí (requerirían replica set).

## Modelo de datos

No se introducen colecciones ni campos nuevos. `models/Experiencia.js` y `models/Hito.js` quedan intactos.

Contrato de entrada de `PUT /api/experiencia/:id` (body JSON, `express.json()`):

```json
{
  "empresa": "ACME",
  "descripcion": "Backend developer",
  "fechaInicio": "2020-01-01",
  "fechaFin": "",
  "tecnologias": ["664a...", "664b..."],
  "hitos": [
    { "id": "667a...", "descripcion": "Migré el monolito a servicios" },
    { "descripcion": "Hito nuevo, sin id" }
  ]
}
```

- `fechaFin` con cadena vacía se guarda como `null`, igual que en `crearExperiencia`.
- `tecnologias` se normaliza con la misma lógica que ya existe en `crearExperiencia` (`[].concat(...)`, `split(",")`, `trim`, descartar vacíos).
- `hitos` **no** se parte por comas: el texto libre puede contenerlas.

Helper compartido, en `controllers/experiencia.js`:

```js
// Acepta ["texto", ...] (formato SPEC 01) y [{ id?, descripcion }, ...] (formato nuevo).
// Devuelve siempre [{ id: string | undefined, descripcion: string }] sin descripciones vacías.
const normalizarHitos = (hitos) =>
  []
    .concat(hitos ?? [])
    .map((hito) =>
      typeof hito === "string"
        ? { id: undefined, descripcion: hito }
        : { id: hito?.id, descripcion: hito?.descripcion ?? "" }
    )
    .map(({ id, descripcion }) => ({ id, descripcion: String(descripcion).trim() }))
    .filter(({ descripcion }) => descripcion !== "");
```

Reglas de reconciliación de hitos en el PUT, dado el array normalizado y los hitos actuales en base de datos:

| Caso | Acción |
| --- | --- |
| Hito con `id` que **sí** pertenece a esa experiencia | `updateOne` de su `descripcion` |
| Hito con `id` que no existe o pertenece a otra experiencia | Se ignora el `id` y se **crea** como hito nuevo |
| Hito sin `id` | Se crea con `experiencia: id` |
| Hito en base de datos cuyo `id` no aparece en el body | Se **borra** |

Respuesta 200, mismo shape que `POST /api/experiencia`:

```json
{
  "id": "665...",
  "empresa": "ACME",
  "descripcion": "Backend developer",
  "fechaInicio": "2020-01-01T00:00:00.000Z",
  "fechaFin": null,
  "tecnologias": ["664a..."],
  "hitos": [{ "id": "667a...", "descripcion": "...", "experiencia": "665..." }]
}
```

### Verificación manual (mongosh)

```js
db.hitos.find({ experiencia: ObjectId("<id de la experiencia>") });
db.hitos.countDocuments({ experiencia: ObjectId("<id de la experiencia>") });
```

## Plan de implementación

1. Extraer el helper `normalizarHitos` en `controllers/experiencia.js` y hacer que `crearExperiencia` lo use en lugar de su normalización inline (ignorando el `id`, porque al crear siempre son nuevos). Prueba: un `POST` con `hitos: ["a", "b"]` y otro con `hitos: [{descripcion:"a"}, {descripcion:"b"}]` crean los mismos dos documentos.
2. Escribir `actualizarExperiencia` en `controllers/experiencia.js`: leer `:id`, `Experiencia.findById(id)` y devolver 404 con `{ msg: "Experiencia no encontrada" }` si no existe. Prueba: `PUT` con un ObjectId inexistente responde 404 y no escribe nada.
3. En esa misma función, asignar `empresa`, `descripcion`, `fechaInicio`, `fechaFin` (`"" → null`) y `tecnologias` normalizadas, y hacer `await experiencia.save()`. Prueba: `PUT` cambiando solo `empresa` deja los hitos intactos y devuelve el nuevo valor.
4. Reconciliar hitos: cargar `Hito.find({ experiencia: id })`, construir el `Set` de ids existentes, y a partir del array normalizado separar en tres grupos — a actualizar (`id` presente en el `Set`), a crear (resto, incluidos los ids huérfanos) y a borrar (ids existentes que no aparecen en el body). Ejecutar `updateOne` por cada actualización, `insertMany` para las creaciones y `deleteMany({ _id: { $in: aBorrar } })`. Si el array de un grupo está vacío, no se lanza la operación. Prueba: un `PUT` con un hito editado, uno nuevo y uno omitido deja exactamente dos documentos, con los textos esperados.
5. Responder `res.json(await Experiencia.findById(id).populate("hitos"))`. Prueba: la respuesta trae `hitos` poblado y con `id` (no `_id`).
6. Borrar `actualizarConocimientos` del cuerpo del fichero y de `module.exports`. Prueba: `grep -r actualizarConocimientos` no devuelve nada en el repo del backend.
7. Registrar la ruta en `routes/experiencia.js`: importar `actualizarExperiencia` y añadir `router.put("/:id", actualizarExperiencia);` entre el `post` y el `delete`. Prueba: el servidor arranca y `PUT /api/experiencia/<id>` responde 200.
8. Comprobación end to end con la experiencia real: `GET` → `PUT` con el body completo → `GET`, y verificar que el segundo `GET` refleja los cambios y que `db.hitos.countDocuments` coincide.

## Criterios de aceptación

- [ ] `PUT /api/experiencia/:id` responde 200 con la experiencia actualizada y sus hitos poblados.
- [ ] La respuesta del `PUT` tiene el mismo shape que la del `POST`: expone `id`, no expone `_id` ni `__v`, y cada hito expone `id`, `descripcion` y `experiencia`.
- [ ] `PUT` con un id inexistente responde 404 con `{ msg: "Experiencia no encontrada" }` y no modifica ningún documento.
- [ ] `PUT` con `fechaFin: ""` guarda `fechaFin: null`.
- [ ] `PUT` que cambia `tecnologias` sustituye el array completo por el recibido.
- [ ] Un hito del body con `id` de esa experiencia actualiza su `descripcion` conservando el mismo `_id`.
- [ ] Un hito del body sin `id` se crea con `experiencia` igual al id de la ruta.
- [ ] Un hito del body con un `id` inexistente o de otra experiencia se crea como hito nuevo, y el hito de la otra experiencia no se toca.
- [ ] Un hito existente en base de datos que no aparece en el body queda borrado.
- [ ] `PUT` con `hitos: []` deja `db.hitos.countDocuments({ experiencia: ObjectId(id) })` a 0.
- [ ] Un hito con descripción vacía o solo espacios no se crea ni se actualiza.
- [ ] Un hito con comas en el texto se guarda íntegro, en un único documento.
- [ ] `POST /api/experiencia` sigue funcionando con `hitos` como array de strings (formato SPEC 01).
- [ ] `POST /api/experiencia` funciona también con `hitos` como array de `{ descripcion }`.
- [ ] `actualizarConocimientos` ya no existe en `controllers/experiencia.js` ni en su `module.exports`.
- [ ] `DELETE /api/experiencia/:id` sigue borrando los hitos en cascada.

## Decisiones

- **Sí:** borrar `actualizarConocimientos`. No está enrutada en `routes/experiencia.js`, así que nunca se ha ejecutado, y opera sobre `experiencia.conocimientos`, campo que no existe en `models/Experiencia.js` (el real es `tecnologias`): si se llamara, fallaría. La sustituye `actualizarExperiencia`.
- **Sí:** `PUT` con reemplazo completo, en vez de `PATCH` parcial. El formulario del frontend manda siempre todos los campos; un `PATCH` añadiría lógica de "campo presente o ausente" sin ningún consumidor que la aproveche, y con los hitos sería directamente ambiguo (¿`hitos` ausente significa "no tocar" o "borrar todos"?).
- **Sí:** reconciliación de hitos por id, en vez de borrar todos e insertar de nuevo. Conserva los `_id`, que es lo que pidió el usuario; borrar e insertar haría que cada edición cambiara todas las referencias.
- **Sí:** un `id` de hito huérfano o ajeno se trata como hito nuevo, no como error 400. Es tolerante y nunca deja al usuario con un formulario que no puede guardar; el `id` ajeno se descarta, así que no hay riesgo de reasignar el hito de otra experiencia.
- **Sí:** helper `normalizarHitos` compartido por crear y actualizar, aceptando strings y objetos. Evita duplicar la normalización y permite desplegar esta spec sin desplegar a la vez la del frontend.
- **No:** exigir el formato nuevo `[{ descripcion }]` en el `POST`. Rompería el frontend actual hasta que se implemente la SPEC 03 y acoplaría los dos despliegues.
- **No:** partir los hitos por comas, a diferencia de `tecnologias`. Se mantiene el criterio de la SPEC 01: el texto libre puede contener comas.
- **Sí:** devolver la experiencia poblada en la respuesta. Permite al frontend reemplazar el elemento en el store sin una request extra, igual que ya hace `eliminarExperiencia`.
- **No:** transacciones. Requieren replica set; el proyecto ya asume esta limitación desde la SPEC 01.
- **No:** endpoints `/api/hito`. Los hitos se siguen gestionando solo a través de la experiencia.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Un `id` de hito de **otra** experiencia llega en el body y su `updateOne` lo reasigna | Los ids se cotejan contra `Hito.find({ experiencia: id })` antes de decidir; los que no están en ese conjunto van al grupo "crear", nunca al de actualizar. Criterio de aceptación específico. |
| El `deleteMany` borra hitos que sí seguían en el form porque el frontend no mandó sus ids | El grupo "a borrar" se calcula solo con los ids existentes en base de datos; un hito que llegue sin `id` se crea, nunca provoca un borrado indebido. Se verifica con el caso end to end del paso 8. |
| La experiencia se guarda pero falla la reconciliación de hitos, dejando estado a medias | Se responde 500 y se documenta que la experiencia puede haber quedado actualizada. Sin transacciones no hay alternativa; el usuario puede repetir el `PUT`, que es idempotente. |
| Cambiar `crearExperiencia` para usar el helper rompe el `POST` que ya funciona | El paso 1 se prueba con los dos formatos antes de tocar nada más, y hay criterios de aceptación para ambos. |
| `tecnologias` llega vacío y se borran todas las tecnologías de la experiencia sin querer | Es el comportamiento esperado del `PUT` (reemplazo completo); el frontend siempre manda el array actual del formulario. Documentado como criterio de aceptación, no como bug. |
| Un `:id` con formato no válido de ObjectId hace que `findById` lance y devuelva 500 en lugar de 404 | Aceptado: es el mismo comportamiento que ya tiene `eliminarExperiencia`. La ruta solo la consume el frontend, con ids que vienen del propio `GET`. |
