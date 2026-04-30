# API Contracts: Escolástico con Privilegios Plenos de Asistencia

**Feature**: `024-asistencia-privilegios-escolastico`  
**Date**: 2026-04-24

## Endpoint modificado

### `GET /clases/hoy`

**Roles permitidos**: `Instructor`, `Escolastico` (sin cambio)

**Cambio de comportamiento**:

| Actor        | Resultado                                                         |
|--------------|-------------------------------------------------------------------|
| `Instructor` | Clases donde `instructor_id = req.user.id` con sesión hoy        |
| `Escolastico`| Todas las clases activas con sesión hoy (sin filtro por instructor)|

**Response** (sin cambios de estructura):
```json
[
  {
    "id": "uuid",
    "codigo": "PSICOLOGIA-04-2026-A",
    "materia": { "id": "uuid", "nombre": "Psicología" },
    "horarios": [{ "dia_semana": 2, "hora_inicio": "...", "hora_fin": "..." }],
    "_count": { "inscripciones": 12 }
  }
]
```

---

## Endpoints sin cambios

Los siguientes endpoints ya admiten `Escolastico` y registran `req.user.id` como actor:

| Endpoint                                              | Descripción                                  |
|-------------------------------------------------------|----------------------------------------------|
| `POST /clases/:id/sesiones`                           | Crear/recuperar sesión del día (idempotente) |
| `GET /clases/:id/sesiones/:sesionId/asistencias`      | Lista de alumnos con estado de asistencia    |
| `POST /clases/:id/sesiones/:sesionId/asistencias/bulk`| Upsert masivo de asistencias                 |
| `PATCH /clases/:id/sesiones/:sesionId/asistencias/:id`| Actualizar asistencia individual             |
| `GET /clases/:id/asistencias/resumen`                 | Resumen de % asistencia por alumno           |
