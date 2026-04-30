# Contract: Sesiones API

**Base URL**: `/` (controller raíz via `SesionesController`)  
**Auth**: Bearer JWT requerido en todos los endpoints  
**Roles permitidos**: `Instructor`, `Escolastico` (salvo indicación)

---

## GET /clases/hoy

Retorna las clases del día para el usuario autenticado.

**Comportamiento por rol**:
- **Instructor**: clases donde `instructor_id == userId` con `horario.dia_semana == diaSemana_actual`.
- **Escolástico**: todas las clases con `estado == 'Activa'` (sin filtro por instructor ni horario).

**Response 200**:
```json
[
  {
    "id": "uuid",
    "codigo": "string",
    "materia": { "id": "uuid", "nombre": "string" },
    "instructor": { "id": "uuid", "nombre_completo": "string" },
    "horarios": [{ "dia_semana": 1, "hora_inicio": "08:00", "hora_fin": "10:00" }],
    "_count": { "inscripciones": 15 }
  }
]
```

---

## POST /clases/:id/sesiones

Crea la sesión del día para la clase indicada (idempotente).

**Comportamiento**: Si ya existe una sesión con `fecha == hoy` para la clase, retorna la existente en lugar de crear una nueva.

**Request Body**: vacío `{}`

**Response 201**:
```json
{
  "id": "uuid",
  "clase_id": "uuid",
  "fecha": "2026-04-24",
  "tipo": "Clase",
  "tema_id": null,
  "comentarios": null,
  "created_at": "2026-04-24T..."
}
```

---

## GET /clases/:id/sesiones

Lista todas las sesiones de una clase con conteo de asistentes.

**Response 200**:
```json
[
  {
    "id": "uuid",
    "clase_id": "uuid",
    "fecha": "2026-04-24",
    "tipo": "Clase",
    "tema": { "id": "uuid", "titulo": "string" },
    "_count": { "asistencias": 18 }
  }
]
```

---

## GET /clases/:id/asistencias/resumen

Resumen de asistencias por alumno para una clase, incluyendo porcentajes calculados.

**Response 200**:
```json
[
  {
    "inscripcion_id": "uuid",
    "usuario": { "id": "uuid", "nombre_completo": "string" },
    "total_sesiones": 10,
    "presentes": 8,
    "ausentes": 1,
    "licencias": 1,
    "porcentaje": 80
  }
]
```
