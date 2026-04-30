# Quickstart: Ficha de Probacionista — Escenarios de Integración

**Branch**: `017-probacionista-ficha`  
**Date**: 2026-04-22

## Prerequisitos para probar

1. BD con usuario Probacionista que haya sido inscrito en una materia con `es_curso_probacion = true`.
2. Usuario Escolástico autenticado (token JWT).
3. API corriendo en `http://localhost:3000/api`.

## Escenario 1: Probacionista con inscripción en materia de probacionismo

```bash
# Setup (seed o manual):
# - Crear materia "Introducción al Escolasticismo" con es_curso_probacion=true
# - Crear instructor "Carlos López" (rol Instructor)
# - Crear clase de esa materia con instructor_id=Carlos
# - Crear Probacionista "Ana García" e inscribirla en esa clase

# Consultar bandeja de aprobación
GET /api/users/pending-approval
Authorization: Bearer <token-escolastico>

# Respuesta esperada para Ana García:
{
  "nombre_completo": "Ana García",
  "instructor_referencia": {
    "nombre_completo": "Carlos López",
    "estado_inscripcion": "Activo",
    "materia": "Introducción al Escolasticismo"
  }
}
```

## Escenario 2: Probacionista sin inscripción en materia de probacionismo

```bash
# Setup: Probacionista "Pedro Ramos" sin inscripciones en materias de probacionismo

GET /api/users/pending-approval
Authorization: Bearer <token-escolastico>

# Respuesta esperada para Pedro:
{
  "nombre_completo": "Pedro Ramos",
  "instructor_referencia": null
}
```

## Escenario 3: Probacionista con múltiples inscripciones — toma la más reciente

```bash
# Setup:
# - "Luis Torres" inscrito en clase-A (probacion, instructor: "Prof. A", fecha: 2025-01)
# - "Luis Torres" inscrito en clase-B (probacion, instructor: "Prof. B", fecha: 2026-03)

GET /api/users/pending-approval

# Respuesta esperada: instructor_referencia = Prof. B (más reciente)
```

## Escenario 4: Instructor de referencia desactivado

```bash
# Setup: El instructor del Probacionista fue desactivado (estado=Inactivo)

GET /api/users/pending-approval

# El nombre del instructor debe aparecer igualmente (no se filtra por estado del instructor)
# instructor_referencia.nombre_completo = "Carlos López" (aunque esté Inactivo)
```

## Verificación frontend

1. Abrir `/admin/users/pending`
2. Confirmar que cada tarjeta muestra la sección "Instructor de referencia"
3. Para Probacionistas sin inscripción, la sección muestra "Sin inscripción registrada"
4. El campo no tiene botón de edición ni input asociado (solo lectura)
