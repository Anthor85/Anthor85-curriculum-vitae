# SPEC 06 — Edición de Perfil (PUT único)

> **Estado:** Implementada
> **Depende de:** SPEC 05 del backend (`05-editar-formacion-complementaria.md`, Implementada) — solo como precedente de patrón, no hay dependencia técnica
> **Fecha:** 2026-08-31
> **Objetivo:** Añadir `PUT /api/perfil` (sin `:id`) que actualice el único perfil existente y devuelva el documento actualizado, con 404 si todavía no hay ninguno, manteniendo el `POST` actual como vía de creación.

## Alcance

**Dentro:**

- Nueva función `actualizarPerfil` en `controllers/perfil.js`: `Perfil.findOne()`, 404 si no existe, reemplazo de campos y `save()` si existe.
- Nueva ruta `router.put("/", actualizarPerfil)` en `routes/perfil.js`, después del `post("/")`.
- Reemplazo completo de los ocho campos del modelo (`nombre`, `apellidos`, `email`, `telefono`, `direccion`, `fechaNacimiento`, `descripcion`, `foto`) con lo recibido en el body, campo a campo.
- `foto` (único campo sin `required`) se normaliza en el `PUT` **y en el `POST`**: `""`, `null` o ausente se asignan como `undefined`, de modo que mongoose haga `$unset` y se pueda borrar una foto ya guardada.
- Respuesta 200 con el mismo shape que devuelven hoy el `GET` y el `POST`: los campos del perfil más `id`, sin `_id` ni `__v`, vía el `toJSON` del modelo.
- Respuesta 404 con `{ msg: "Perfil no encontrado" }` —el mismo mensaje que ya usa el `GET`— si la colección está vacía.
- Respuesta 500 con `{ msg: "Error al actualizar el perfil" }` si `save()` falla, incluidos los fallos de `required` y el `unique` de `email`.
- `GET /api/perfil` se mantiene exactamente igual, **incluido el 404** cuando la colección está vacía.
- `POST /api/perfil` y `crearPerfil` **se mantienen**: solo cambia la normalización de `foto` descrita arriba. Su respuesta 201 no cambia de forma.

**Fuera de alcance (para futuras specs):**

- `DELETE /api/perfil`: no existe hoy y no se añade; con un único perfil, borrarlo no tiene caso de uso.
- Upsert en el `PUT` (crear el perfil si no existe): la decisión de crear o actualizar la toma el frontend según tenga o no `id` (SPEC 07 del frontend).
- `PUT /api/perfil/:id`: el perfil es un singleton y `findOne()` ya resuelve cuál es el documento.
- Cambiar el 404 del `GET` por un 200 con `null` o con un objeto de campos vacíos: es un contrato ya en uso y el frontend puede tratar el 404 (SPEC 07 del frontend).
- Impedir que existan varios perfiles en la colección (índice único, validación de cardinalidad en el `POST`).
- `PATCH` parcial: el formulario manda siempre los ocho campos.
- Validación con `express-validator`: no se usa en ningún controlador del proyecto.
- Devolver 400 con mensajes de validación por campo; los `required` del modelo siguen produciendo 500.
- Hacer `descripcion` opcional en el modelo: se resuelve en el frontend añadiendo `required` al input (SPEC 07 del frontend).
- Subida de ficheros para `foto`: sigue siendo una `String` con la URL.
- Cambios en `controllers/curriculum.js`: sigue haciendo `Perfil.findOne()` y devolviendo el mismo shape.
- Autenticación o autorización del `PUT`.

## Modelo de datos

No se introducen colecciones nuevas ni campos nuevos. `models/Perfil.js` **no se toca**: `nombre`, `apellidos`, `email` (`unique`), `telefono`, `direccion`, `descripcion` como `String` con `required` y `trim`, `fechaNacimiento` como `Date` con `required`, `foto` como `String` con `trim` y **sin** `required`, más el `toJSON` que expone `id`.

Contrato de entrada de `POST` y `PUT /api/perfil` (body JSON, `express.json()`):

```json
{
  "nombre": "Antonio",
  "apellidos": "Macián Martínez",
  "email": "antonio@example.com",
  "telefono": "600000000",
  "direccion": "Valencia",
  "fechaNacimiento": "1985-04-17",
  "descripcion": "Desarrollador frontend",
  "foto": "https://example.com/foto.jpg"
}
```

- Los siete campos `required` se asignan tal cual; el `trim: true` del schema recorta los de tipo `String`.
- `fechaNacimiento` acepta cualquier valor casteable a `Date`, el `"YYYY-MM-DD"` de un `<input type="date">` incluido.
- `foto` es el único opcional: `""`, `null` o ausente se normalizan a `undefined` (`foto: foto || undefined`), lo que en el `POST` deja el documento sin la clave y en el `PUT` hace `$unset`.
- Cualquier campo extra del body se ignora: la asignación es explícita, campo a campo, no `Object.assign(perfil, req.body)`.

Respuesta 200 del `PUT`, mismo shape que el `GET` y que el 201 del `POST`:

```json
{
  "nombre": "Antonio",
  "apellidos": "Macián Martínez",
  "email": "antonio@example.com",
  "telefono": "600000000",
  "direccion": "Valencia",
  "fechaNacimiento": "1985-04-17T00:00:00.000Z",
  "descripcion": "Desarrollador frontend",
  "foto": "https://example.com/foto.jpg",
  "id": "664a..."
}
```

Si el documento no tiene `foto`, la propiedad no aparece en la respuesta.

### Verificación manual (mongosh)

```js
db.perfils.findOne();
db.perfils.countDocuments(); // 0 antes del primer POST, 1 después; el PUT nunca lo cambia
db.perfils.countDocuments({ foto: { $exists: true } });
```

## Plan de implementación

1. Normalizar `foto` en `crearPerfil`: pasar `foto: foto || undefined` al constructor. Prueba: un `POST` con `foto: ""` sigue respondiendo 201 y el documento se crea sin la clave; un `POST` con foto la guarda igual que antes.
2. Escribir `actualizarPerfil` en `controllers/perfil.js`, siguiendo el estilo de `obtenerPerfil` y de `actualizarConocimiento`: desestructurar los ocho campos de `req.body`, `const perfil = await Perfil.findOne();` y devolver 404 con `{ msg: "Perfil no encontrado" }` si no existe. Prueba: con la colección vacía, un `PUT` responde 404 y no escribe nada.
3. En esa misma función, asignar los siete campos `required` desde el body y `perfil.foto = foto || undefined`, hacer `await perfil.save()` y responder `res.json(perfil)`. Envolver todo en `try/catch` con `console.error(error)` y 500 `{ msg: "Error al actualizar el perfil" }`. Prueba: un `PUT` con valores nuevos responde 200 con esos valores y con `id`.
4. Exportar `actualizarPerfil` en el `module.exports` del controlador, junto a `obtenerPerfil` y `crearPerfil`. Prueba: `require("./controllers/perfil").actualizarPerfil` es una función y `crearPerfil` sigue siéndolo.
5. Registrar la ruta en `routes/perfil.js`: importar `actualizarPerfil` y añadir `router.put("/", actualizarPerfil);` después del `router.post("/", crearPerfil);`. Prueba: el servidor arranca, `PUT /api/perfil` responde y el `POST` sigue funcionando.
6. Comprobación end to end: partiendo de la colección vacía, `GET /api/perfil` → 404; `PUT` → 404; `POST` → 201; `GET` → 200 con esos datos; `PUT` cambiando varios campos → 200 con el mismo `id` y `countDocuments()` en 1; `PUT` con `foto: ""` → la propiedad desaparece; `GET /api/curriculum` → el `perfil` refleja los valores nuevos con el mismo shape.

## Criterios de aceptación

- [ ] `PUT /api/perfil` con un perfil existente responde 200 con el documento actualizado.
- [ ] `PUT /api/perfil` con la colección vacía responde 404 con `{ msg: "Perfil no encontrado" }` y no crea ningún documento.
- [ ] El `PUT` nunca crea documentos: `db.perfils.countDocuments()` no varía tras ejecutarlo.
- [ ] El `id` del perfil no cambia entre actualizaciones sucesivas.
- [ ] La respuesta del `PUT` tiene el mismo shape que la del `GET` y la del `POST`: expone `id`, no expone `_id` ni `__v`.
- [ ] `PUT` actualiza los ocho campos del modelo con lo recibido en el body.
- [ ] `PUT` con `foto` sobre un perfil que no la tenía se la añade.
- [ ] `PUT` con `foto: ""` (o sin `foto`) sobre un perfil que sí la tenía la elimina, y la respuesta ya no incluye la propiedad.
- [ ] `POST` con `foto: ""` sigue respondiendo 201 y el documento se crea sin esa clave.
- [ ] `POST /api/perfil` sigue respondiendo 201 con el mismo shape que antes de esta spec.
- [ ] `PUT` sin uno de los campos `required` (por ejemplo `nombre` o `descripcion`) responde 500 y no deja el documento a medias.
- [ ] `PUT` con un campo extra en el body (por ejemplo `foo`) lo ignora y no lo guarda en la colección.
- [ ] Los campos `String` con espacios al principio o al final se guardan recortados.
- [ ] `GET /api/perfil` sigue respondiendo 404 con `{ msg: "Perfil no encontrado" }` cuando la colección está vacía, y 200 con el mismo shape cuando el perfil existe.
- [ ] `GET /api/curriculum` sigue devolviendo `perfil` con el mismo shape y con los valores actualizados.
- [ ] Los endpoints de `/api/formacion`, `/api/formacionComplementaria`, `/api/conocimiento` y `/api/experiencia` no cambian de comportamiento.

## Decisiones

- **Sí:** `PUT /api/perfil` **sin** `:id`, a diferencia de las SPEC 02–05. El perfil es un singleton: `findOne()` resuelve siempre cuál es el documento y la ruta no necesita parametrizarse.
- **Sí:** mantener `POST /api/perfil`. Hará falta más adelante, y separar creación de actualización deja los dos verbos con la semántica estándar en vez de meter un upsert en el `PUT`.
- **Sí:** el `PUT` responde 404 en vez de crear. La decisión de crear o actualizar la toma el frontend según tenga o no `id` (SPEC 07 del frontend); el backend no adivina.
- **Sí:** reutilizar el `msg` `"Perfil no encontrado"` que ya devuelve el `GET`, en vez de inventar uno nuevo. Es el mismo hecho.
- **No:** añadir `DELETE /api/perfil`. Nunca ha existido, el frontend no lo necesita y borrar el único perfil dejaría la aplicación en el estado 404.
- **No:** cambiar el 404 del `GET` por 200 con `null`. Es un contrato existente; el frontend puede tratar el 404 como "todavía no hay perfil" (SPEC 07 del frontend).
- **Sí:** `findOne` + asignación + `save()`, en vez de `findOneAndUpdate`. `save()` dispara los `required` con la configuración por defecto y el patrón coincide con `actualizarConocimiento` y `actualizarFormacionComplementaria`.
- **Sí:** asignar campo a campo en lugar de `Object.assign`. Evita que un body malicioso o descuidado escriba campos que no son del contrato.
- **Sí:** normalizar `foto` vacía a `undefined` también en el `POST`, no solo en el `PUT`. Es la única forma de borrar una foto desde un formulario de reemplazo completo, y deja los dos verbos con el mismo contrato de entrada.
- **No:** hacer `descripcion` opcional en el modelo. El dato aparece en la vista pública `/curriculum` (`MainPage`), así que se corrige el formulario, no el modelo.
- **No:** validar a mano para devolver 400. Ningún controlador del proyecto valida hoy y los `required` del modelo ya impiden el dato malo.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| El `POST` sigue permitiendo crear un segundo perfil, y entonces el `PUT` actualizaría siempre el que devuelva `findOne()` dejando los demás huérfanos | Aceptado y consciente: el único consumidor es el formulario, que solo llama al `POST` cuando no hay `id` (SPEC 07 del frontend). Se verifica `db.perfils.countDocuments()` al probar |
| El `unique` de `email` hace que un `POST` falle con 500 si ya existe un perfil con ese email | Comportamiento actual, no cambia; con un único perfil el `PUT` no colisiona consigo mismo |
| Un `fechaNacimiento` con formato no casteable a `Date` hace que `save()` falle y devuelva 500 | Aceptado, mismo trato que los `required`. El frontend solo manda el `"YYYY-MM-DD"` de un `<input type="date">` |
| Un `PUT` desde un consumidor que no mande `foto` borra la foto guardada | Es el comportamiento buscado del `PUT` con reemplazo completo; el único consumidor es el formulario, que mandará siempre el campo |
| Normalizar `foto` en el `POST` cambia una respuesta existente | Solo afecta al caso `foto: ""`, que hoy guarda una cadena vacía inútil; el shape con foto real no cambia y tiene criterio de aceptación propio |
