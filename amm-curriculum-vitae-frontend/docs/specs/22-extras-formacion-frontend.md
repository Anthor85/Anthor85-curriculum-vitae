# SPEC 22 — Extras de Formación en el frontend

> **Estado:** Implementada
> **Depende de:** SPEC 12 backend (`12-extras-formacion.md`); SPEC 05 (`05-editar-formacion-frontend.md`)
> **Fecha:** 2026-10-23
> **Objetivo:** Sustituir el campo único «A tener en cuenta» (`descripcion`) de Formación por una lista de `extras`, gestionada como los hitos de Experiencia.

## Cambios

- `interfaces/formacion.interface.ts`: nuevos `Extra` y `ExtraPayload`; `Formacion.extras: Extra[]`; `FormacionPayload.extras: ExtraPayload[]`. Desaparece `descripcion`.
- `FormacionForm`: grupo «Extra:» con una fila por extra (`name="extras"`, `aria-label="Extra N"`), botón «X» por fila y «+ Añadir extra». Al editar una formación sin extras aparece una fila en blanco. Los extras en blanco no viajan en el payload.
- `FormacionCard`: lista «Extra:» con los extras, omitida si no hay.
- `FormacionItem` (vista Curriculum): los extras se listan bajo la fecha con sangría y viñeta (clase `.extras` en `Items.module.scss`).
- El PDF no mostraba la descripción y sigue sin mostrar los extras.

## Criterios de aceptación

- [x] El form envía `extras: [{ id?, descripcion }]` sin filas vacías.
- [x] «Editar» vuelca los extras en el form conservando sus id.
- [x] «Borrar formulario» deja el form sin filas de extra.
- [x] La pestaña «Formación Académica» lista los extras de cada formación.
