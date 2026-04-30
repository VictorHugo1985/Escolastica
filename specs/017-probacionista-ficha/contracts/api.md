# API Contracts: Ficha de Probacionista

**Branch**: `017-probacionista-ficha`  
**Date**: 2026-04-22

## Endpoint modificado

### GET /users/pending-approval

**Descripción**: Lista todos los Probacionistas pendientes de aprobación. Se extiende para incluir el instructor de referencia de su materia de probacionismo.  
**Auth**: Bearer JWT — rol `Escolastico` requerido.  
**Cambio**: Agrega `instructor_referencia` al objeto de respuesta por usuario.

#### Response 200

```json
[
  {
    "id": "uuid",
    "nombre_completo": "Ana García",
    "email": "ana@email.com",
    "ci": "12345678",
    "telefono": null,
    "created_at": "2026-03-15T10:00:00Z",
    "fecha_entrevista": "2026-04-10",
    "entrevista_completada": true,
    "rol": {
      "id": "uuid",
      "nombre": "Probacionista"
    },
    "instructor_referencia": {
      "nombre_completo": "Carlos López",
      "estado_inscripcion": "Finalizado",
      "materia": "Introducción al Escolasticismo"
    }
  },
  {
    "id": "uuid",
    "nombre_completo": "Pedro Ramos",
    "email": null,
    "ci": null,
    "telefono": "12345678",
    "created_at": "2026-04-01T08:00:00Z",
    "fecha_entrevista": null,
    "entrevista_completada": false,
    "rol": {
      "id": "uuid",
      "nombre": "Probacionista"
    },
    "instructor_referencia": null
  }
]
```

#### Campos nuevos en la respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `instructor_referencia` | `object \| null` | Datos del instructor de la inscripción más reciente en materia de probacionismo. `null` si no existe inscripción. |
| `instructor_referencia.nombre_completo` | `string` | Nombre completo del instructor. |
| `instructor_referencia.estado_inscripcion` | `"Activo" \| "Baja" \| "Finalizado"` | Estado de la inscripción de referencia. |
| `instructor_referencia.materia` | `string` | Nombre de la materia de probacionismo. |

#### Lógica de selección

- Se toma la inscripción del Probacionista donde `clase.materia.es_curso_probacion = true`.
- Si hay múltiples, se ordena por `fecha_inscripcion DESC` y se toma la primera (`TAKE 1`).
- Si no hay ninguna, `instructor_referencia = null`.

#### Response 401
```json
{ "statusCode": 401, "message": "Unauthorized" }
```

#### Response 403
```json
{ "statusCode": 403, "message": "Forbidden resource" }
```

---

## Endpoint existente (sin cambios)

### PATCH /users/:id/interview

Implementado en spec 003 US5. No requiere cambios en esta spec.
