# API Contracts: Horario Fijo Obligatorio por Clase

**Branch**: `025-horario-fijo-clases` | **Date**: 2026-04-25

---

## Contratos modificados

### POST /clases — Crear clase

**Cambio**: Se elimina `aula_id` del body y se añade `horario` (requerido).

**Request body (nuevo)**:
```json
{
  "materia_id": "uuid",
  "instructor_id": "uuid",
  "mes_inicio": 4,
  "anio_inicio": 2026,
  "celador": "Nombre Celador",
  "fecha_inicio": "2026-04-01",
  "fecha_fin": "2026-07-31",
  "paralelo": "A",
  "horario": {
    "dia_semana": 4,
    "hora_inicio": "20:00",
    "hora_fin": "22:00",
    "aula_id": "uuid-opcional"
  }
}
```

**Validaciones**:
- `horario` es requerido; sin él la petición retorna `400 Bad Request`
- `dia_semana`: entero entre 0 (Dom) y 6 (Sáb), requerido
- `hora_inicio` / `hora_fin`: string formato `HH:MM`, requerido
- `aula_id`: uuid, opcional

**Response** (sin cambios en estructura):
```json
{
  "id": "uuid",
  "codigo": "FIL-ABR-2026",
  "materia": { "id": "uuid", "nombre": "Filosofía" },
  "instructor": { "id": "uuid", "nombre_completo": "Juan Pérez" }
}
```

---

### PATCH /clases/:id — Actualizar clase

**Cambio**: Se elimina `aula_id` del body. La edición de horarios se hace exclusivamente vía `POST /clases/:id/horarios` y `DELETE /clases/:id/horarios/:horarioId`.

**Request body (nuevo)**:
```json
{
  "materia_id": "uuid (opcional)",
  "instructor_id": "uuid (opcional)",
  "mes_inicio": 5,
  "anio_inicio": 2026,
  "celador": "Nombre (opcional)",
  "fecha_inicio": "2026-05-01 (opcional)",
  "fecha_fin": "2026-08-31 (opcional)",
  "paralelo": "B (opcional)"
}
```

---

## Contratos sin cambios

### GET /clases — Listado de clases

No hay cambios. El campo `horarios` ya se incluye en la respuesta:
```json
{
  "horarios": [
    {
      "dia_semana": 4,
      "hora_inicio": "1970-01-01T20:00:00.000Z",
      "hora_fin": "1970-01-01T22:00:00.000Z",
      "aula": { "id": "uuid", "nombre": "Sala A" }
    }
  ]
}
```

Este campo es el que alimenta tanto los chips de día en la página de Listas como la pre-carga de fecha al crear sesiones.

---

### POST /clases/:id/sesiones — Crear sesión

No hay cambios. Acepta `fecha` opcional; el frontend calcula el día de la semana del horario registrado y lo pasa como `fecha`.

---

## Contrato de UI: Filtro por día en página de Listas

**Ubicación**: `apps/web/src/app/(admin)/admin/asistencia/page.tsx`

**Comportamiento**:
- Instructor: al cargar, `filtrodia` se inicializa con `new Date().getDay()` (día actual)
- Admin/Escolástico: `filtrodia` inicia en `null` (sin filtro activo, muestra todo)
- Seleccionar un día filtra `clasesFiltradas` a las que tienen `horarios.some(h => h.dia_semana === filtrodia)`
- Seleccionar "Todos" o limpiar resetea a `null`

**Días disponibles** (solo los que tienen clases activas, o lista completa):
```
0 = Domingo | 1 = Lunes | 2 = Martes | 3 = Miércoles
4 = Jueves  | 5 = Viernes | 6 = Sábado
```
