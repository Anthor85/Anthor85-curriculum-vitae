# SPEC 11 — `prioridad` en Conocimiento en lugar de `nivel`

> **Estado:** Aprobado
> **Depende de:** SPEC 03 (`03-editar-conocimiento.md`, Implementada), que fija el `PUT /api/conocimiento/:id`; SPEC 09 (`09-tests-backend-vitest.md`), que fija `test/api/conocimiento.test.js` y `crearConocimientoEnBd`
> **Fecha:** 2026-10-21
> **Objetivo:** Sustituir en el modelo `Conocimiento` el campo `nivel` (`Básico`/`Intermedio`/`Avanzado`) por `prioridad` (`Muy alta`/`Alta`/`Media`/`Baja`/`Muy baja`, por defecto `Media`), que `POST` y `PUT /api/conocimiento` guardan, y migrar todos los conocimientos existentes a `Media` borrando `nivel`.

## Alcance

**Dentro:**

- `models/Conocimiento.js`: se elimina `nivel` y se añade `prioridad` (`String`, `required`, `enum` de cinco valores, `default: 'Media'`).
- `controllers/conocimiento.js`:
  - `crearConocimiento` y `crearConocimientos` no cambian de código: `new Conocimiento(req.body)` e `insertMany` aplican el `default` y el `strict` del schema descarta `nivel` si llega.
  - `actualizarConocimiento` deja de asignar `nivel` y asigna `prioridad` solo si viene en el body (`!== undefined`); si no viene, conserva la actual. `titulo` sigue asignándose siempre.
- Respuestas (`GET`, `POST`, `POST /multiple`, `PUT` de `/api/conocimiento` y `GET /api/curriculum`) incluyen `prioridad` y no `nivel`, vía el `toJSON` actual. Sin cambios en `controllers/curriculum.js` ni en rutas.
- Un `prioridad` fuera del `enum` hace fallar `save()` y responde el `500` genérico (`Error al crear el conocimiento` / `Error al actualizar el conocimiento`).
- `test/utils/fixtures.js`: `crearConocimientoEnBd` siembra `prioridad: 'Media'` en lugar de `nivel: 'Avanzado'`.
- `test/api/conocimiento.test.js` (y cualquier otro test que use `nivel` de conocimiento): pasan a `prioridad` y se añaden casos nuevos (ver plan).
- Migración manual con `mongosh` en local y en producción: `prioridad: 'Media'` a todos y `$unset` de `nivel`.

**Fuera de alcance (para futuras specs):**

- Todo el frontend (formulario, cards, orden en `Curriculum` y PDF). Va en la SPEC 20 del frontend.
- Ordenar en el backend por prioridad o por título: el orden lo resuelve el frontend en `ordenarCurriculum`.
- `400` con mensaje propio para una `prioridad` inválida: sigue el `500` genérico, como el `enum` de `nivel` hoy.
- Script de migración versionado: es una orden única de `mongosh`, como en la SPEC 10.
- Borrar `crearConocimientos` (`POST /multiple`).
- Cambios en `scripts/clonarBBDD.js`: clona la colección tal cual.

## Modelo de datos

Campo eliminado de `ConocimientoSchema`: `nivel` (`String`, `required`, `enum: ['Básico', 'Intermedio', 'Avanzado']`).

Campo nuevo:

```js
prioridad: {
  type: String,
  required: true,
  enum: ['Muy alta', 'Alta', 'Media', 'Baja', 'Muy baja'],
  default: 'Media',
},
```

Contrato de entrada de `POST /api/conocimiento` y `PUT /api/conocimiento/:id`:

```json
{
  "titulo": "React",
  "prioridad": "Alta"
}
```

- `POST`: `prioridad` ausente → se guarda `Media`. Valor fuera del `enum` → `500`, no se crea nada.
- `PUT`: `prioridad` ausente → se conserva la actual. Valor fuera del `enum` → `500`, el documento no cambia.
- `nivel` deja de formar parte del contrato: si llega, se ignora y no se guarda.

Respuesta (mismo shape que hoy, cambiando la clave):

```json
{
  "titulo": "React",
  "prioridad": "Alta",
  "id": "664a..."
}
```

### Migración (mongosh)

```js
db.conocimientos.updateMany({}, { $set: { prioridad: 'Media' }, $unset: { nivel: '' } });
db.conocimientos.countDocuments({ nivel: { $exists: true } }); // 0
db.conocimientos.countDocuments({ prioridad: { $ne: 'Media' } }); // 0
```

## Plan de implementación

1. **Modelo.** Sustituir `nivel` por `prioridad` en `models/Conocimiento.js`. Actualizar `crearConocimientoEnBd` a `prioridad: 'Media'`. Prueba: el servidor arranca.
2. **`actualizarConocimiento`.** Quitar la asignación de `nivel` y asignar `prioridad` solo si `req.body.prioridad !== undefined`. Prueba: `PUT` con `prioridad: 'Alta'` la guarda; `PUT` sin `prioridad` conserva la anterior.
3. **Tests existentes.** Cambiar `nivel` por `prioridad` en `test/api/conocimiento.test.js` (incluido el caso de valor fuera del `enum`: `'Experto'` → `500`) y en cualquier otro test que siembre o compare `nivel` de conocimiento (`grep -rn "nivel" test` excluyendo idiomas de perfil). Prueba: `npm test` en verde.
4. **Tests nuevos en `test/api/conocimiento.test.js`:**
   - `POST` sin `prioridad` responde `201` con `prioridad: 'Media'`.
   - `POST` con cada uno de los cinco valores responde `201` y lo devuelve.
   - `POST` con `nivel: 'Avanzado'` y sin `prioridad` responde `201`, la respuesta no trae `nivel` y el documento en la base no tiene la clave.
   - `POST /multiple` sin `prioridad` guarda `Media` en todos.
   - `PUT` sin `prioridad` sobre un conocimiento `Alta` conserva `Alta`.
   - `PUT` con `prioridad: 'Urgente'` responde `500` y el documento conserva la anterior.
   - `PUT` con `nivel` en el body lo ignora.
5. `npm test` y `npm run test:coverage` completos.
6. **Migración en local.** Ejecutar el `updateMany` en la base local. Prueba: `GET /api/conocimiento` devuelve todos con `prioridad: 'Media'` y sin `nivel`; las dos `countDocuments` dan `0`.
7. **Producción.** Desplegar el backend y ejecutar el mismo `updateMany` en producción. Prueba: `GET /api/curriculum` de producción devuelve los conocimientos con `prioridad: 'Media'` y sin `nivel`. Después se despliega el frontend de la SPEC 20.

## Criterios de aceptación

- [ ] `models/Conocimiento.js` y `controllers/conocimiento.js` no contienen ninguna referencia a `nivel`.
- [ ] `POST /api/conocimiento` con `prioridad` válida responde `201` y la devuelve.
- [ ] `POST` sin `prioridad` responde `201` con `prioridad: 'Media'`.
- [ ] `POST /multiple` sin `prioridad` guarda `Media` en todos los documentos.
- [ ] `POST` o `PUT` con `prioridad` fuera del `enum` responde `500` y no escribe nada.
- [ ] `PUT` con `prioridad` nueva la guarda y la devuelve; sin `prioridad` conserva la actual.
- [ ] `POST` y `PUT` con `nivel` en el body lo ignoran: ni la respuesta ni el documento lo tienen.
- [ ] `GET /api/conocimiento` y `GET /api/curriculum` devuelven `prioridad` y no `nivel`, en local y en producción.
- [ ] Tras la migración, `countDocuments({ nivel: { $exists: true } })` y `countDocuments({ prioridad: { $ne: 'Media' } })` son `0` en local y en producción.
- [ ] Los `_id` de los conocimientos no cambian con la migración: `Experiencia.tecnologias` sigue resolviendo.
- [ ] `npm test` y `npm run test:coverage` terminan en verde con el umbral del 80%.

## Decisiones

- **Sí:** nombre `prioridad` y valores en texto (`Muy alta`…`Muy baja`) con `enum`, mismo estilo que `nivel`. **No:** número 1–5: contrato menos legible; el frontend ordena por el índice del enum.
- **Sí:** `required` + `default: 'Media'`. Un `POST` del frontend anterior (que manda `nivel`) sigue funcionando durante el despliegue. **No:** `required` sin default, que obliga a desplegar los dos repos a la vez.
- **Sí:** en `PUT`, `prioridad` ausente conserva la actual. Rompe el reemplazo completo de la SPEC 03 a propósito: un `PUT` del frontend anterior no resetea la prioridad.
- **Sí:** eliminar `nivel` del schema y de la base con `$unset`. **No:** conservarlo en los documentos.
- **Sí:** todos los conocimientos existentes pasan a `Media`; la reclasificación se hace a mano desde el formulario.
- **Sí:** migración con `mongosh` manual en local y producción. **No:** script versionado (precedente SPEC 10).
- **Sí:** orden en el frontend. **No:** ordenar en `GET`: con un `enum` de texto exige agregación o `sort` en JS sin consumidor que lo necesite.
- **No:** `400` con mensaje propio: ningún controlador valida a mano; cae en el `500` de `conContexto`.

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Quitar `nivel` del schema no borra la clave de los documentos y seguiría saliendo en las respuestas | `$unset` en la migración (pasos 6 y 7), con criterio de aceptación propio |
| Documentos sin `prioridad` antes de migrar: el `default` de Mongoose se aplica al leer, pero no persiste | La migración hace `$set` explícito; criterio `countDocuments({ prioridad: { $ne: 'Media' } })` a `0` |
| Entre el despliegue del backend y el del frontend, el frontend anterior no recibe `nivel` | Aceptado: la card lo oculta si falta (`nivel &&`) y el PDF deja vacía `Competencias clave` unos minutos. Desplegar la SPEC 20 justo después |
| El frontend anterior hace `PUT` sin `prioridad` | Se conserva la actual (decisión del `PUT`) |
| Se pierde la clasificación por nivel | Asumido por el usuario: todo pasa a `Media`. Queda en las copias previas de la base |
