# Contract: Asistencias API

**Base URL**: `/`  
**Auth**: Bearer JWT requerido  
**Roles permitidos**: `Instructor`, `Escolastico`

---

## GET /clases/:id/sesiones/:sesionId/asistencias

Lista de alumnos inscritos activos con su estado de asistencia en la sesión indicada.

**Comportamiento**: Si un alumno no tiene registro de asistencia en esa sesión, se retorna `estado: "Ausente"` por defecto.

**Response 200**:
```json
[
  {
    "inscripcion_id": "uuid",
    "usuario": { "id": "uuid", "nombre_completo": "string" },
    "estado": "Presente",
    "asistencia_id": "uuid-or-null"
  }
]
```

**Estados válidos**: `"Presente"` | `"Ausente"` | `"Licencia"`

---

## POST /clases/:id/sesiones/:sesionId/asistencias/bulk

Upsert masivo de asistencias para una sesión.

**Comportamiento**:
- Todos los alumnos inscritos activos son procesados.
- Los incluidos en el payload reciben el estado indicado.
- Los **no** incluidos en el payload quedan con estado `"Ausente"`.
- Operación atómica (transacción Prisma).

**Request Body**:
```json
{
  "asistencias": [
    { "inscripcion_id": "uuid", "estado": "Presente" },
    { "inscripcion_id": "uuid", "estado": "Licencia" }
  ]
}
```

**Validación** (`BulkAsistenciaSchema`):
- `asistencias`: array, puede estar vacío (resulta en todos `Ausente`).
- `inscripcion_id`: UUID válido.
- `estado`: `"Presente"` | `"Ausente"` | `"Licencia"`.

**Response 201**: `{}` (sin cuerpo — operación completada)

---

## PATCH /clases/:id/sesiones/:sesionId/asistencias/:asistenciaId

Actualiza el estado de una asistencia individual. Registra en auditoría el valor anterior y nuevo.

**Request Body**:
```json
{ "estado": "Licencia" }
```

**Validación** (`UpdateAsistenciaSchema`):
- `estado`: requerido, `"Presente"` | `"Ausente"` | `"Licencia"`.

**Response 200**:
```json
{
  "id": "uuid",
  "inscripcion_id": "uuid",
  "sesion_id": "uuid",
  "estado": "Licencia",
  "created_at": "...",
  "updated_at": "..."
}
```

**Auditoría**: `AuditoriaService.log()` registra `{ usuario_id, accion: "UPDATE", tabla_afectada: "asistencias", valor_anterior, valor_nuevo }`.

---

## GET /users/me/asistencias?claseId=:id

Retorna el resumen de asistencias del usuario autenticado para una clase.

**Roles**: Todos los autenticados (Alumno, Instructor, Escolástico).

**Response 200**:
```json
{
  "inscripcion_id": "uuid",
  "clase": { "id": "uuid", "codigo": "string" },
  "total_sesiones": 10,
  "presentes": 7,
  "ausentes": 2,
  "licencias": 1,
  "porcentaje": 70
}
```
