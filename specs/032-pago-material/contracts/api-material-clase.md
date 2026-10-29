# Contract: API de Material por Clase (032)

Base: `/api` (route handlers de Next.js; el módulo NestJS `materiales` expone las mismas rutas sin el prefijo). Todas requieren `Authorization: Bearer <token>`.

**Acceso común** (todas las rutas):
- Rol `Instructor` o `Escolastico`; si no → `403 Sin permisos suficientes`.
- `Instructor` sin rol `Escolastico` solo en clases con `instructor_id = actor` → `403`.
- Clase inexistente → `404 Clase no encontrada`; clase `Inactiva` → `409 La clase está inactiva`.

**Monto**: `number`, `>= 0`, `<= 9999999.9`, máximo 1 decimal. Inválido → `400` con mensaje por campo.

---

## GET `/clases/:id/material`

Control de material de la clase: cabecera (si existe) + lista fija de inscritos con total y detalle.

**200**
```json
{
  "cabecera": { "id": "uuid", "comentarios": "Apuntes del ciclo", "created_at": "2026-10-05T14:00:00Z" },
  "filas": [
    {
      "inscripcion_id": "uuid",
      "usuario": { "id": "uuid", "nombre_completo": "Victor H." },
      "estado_inscripcion": "Activo",
      "total_pagado": 20,
      "temas_sugeridos": [{ "id": "uuid", "titulo": "Tema 1" }],
      "pagos": [
        { "id": "uuid", "fecha": "2026-10-12", "monto": 10, "comentarios": "saldo", "temas": [{ "id": "uuid", "titulo": "Tema 1" }], "registrado_por": { "id": "uuid", "nombre_completo": "Ana Pérez" } },
        { "id": "uuid", "fecha": "2026-10-05", "monto": 10, "comentarios": null, "temas": [{ "id": "uuid", "titulo": "Tema 1" }], "registrado_por": { "id": "uuid", "nombre_completo": "Ana Pérez" } }
      ]
    },
    { "inscripcion_id": "uuid", "usuario": { "id": "uuid", "nombre_completo": "Luis Rojas" }, "estado_inscripcion": "Activo", "total_pagado": 0, "temas_sugeridos": [], "pagos": [] }
  ],
  "total_clase": 20,
  "alumnos_con_pagos": 1,
  "total_inscritos": 2
}
```
- `cabecera: null` si la clase todavía no tiene pagos.
- `filas`: inscritos activos + inscritos no activos con pagos (ver data-model).

## PATCH `/clases/:id/material`

Crea o actualiza la cabecera (comentario general).

**Request** `{ "comentarios": "Apuntes del ciclo" }` → **200** con la cabecera.

## POST `/clases/:id/material/pagos`

Agrega un pago a un alumno. Si la clase no tiene cabecera, se crea en la misma transacción.

**Request**
```json
{ "inscripcion_id": "uuid", "fecha": "2026-10-12", "monto": 10, "tema_ids": ["uuid"], "comentarios": "saldo" }
```
- `inscripcion_id`, `fecha` (`YYYY-MM-DD`) y `monto` obligatorios; `tema_ids` y `comentarios` opcionales.

**201** → el pago creado (mismo formato que un elemento de `pagos`).
**400** → monto inválido, inscripción de otra clase o no activa, tema de otra materia.

## PATCH `/clases/:id/material/pagos/:pagoId`

Edita un pago. Campos opcionales: `fecha`, `monto`, `tema_ids` (reemplaza la lista), `comentarios`.

**200** → el pago actualizado. **404** → pago inexistente o de otra clase.

## DELETE `/clases/:id/material/pagos/:pagoId`

Elimina el pago (y sus temas por cascade).

**204** sin cuerpo. **404** → pago inexistente o de otra clase.

---

## Auditoría

POST, PATCH y DELETE de pagos, y PATCH de la cabecera, registran una fila en `logs_auditoria` con el snapshot descrito en `data-model.md`. Un fallo de auditoría no revierte la operación (mismo comportamiento que `auditLog` actual).

## Endpoints existentes reutilizados

- `GET /clases?estado=Activa|Finalizada[&instructor_id=]` — lista de clases (pantalla Materiales).
- `GET /users/eligible-instructors` — filtro de instructor (Escolástico).
- `GET /materias/:id/temas` — opciones del selector de temas.
- `GET /clases/:id` — cabecera de la clase (materia, instructor).
