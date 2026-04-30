# Research: Ficha de Probacionista — Instructor de Referencia

**Branch**: `017-probacionista-ficha`  
**Phase**: 0 — Research  
**Date**: 2026-04-22

## Decisiones técnicas

### 1. Derivación del instructor de referencia

**Decision**: El nombre del instructor de referencia se deriva en tiempo de consulta mediante `include` anidado en Prisma. No se agrega ningún campo nuevo a la tabla `usuarios`.

**Rationale**: 
- La Constitution prohíbe modificar el esquema base para nuevas funcionalidades cuando es posible extender mediante consulta.
- La relación ya existe: `usuarios → inscripciones → clases → usuarios (instructor)`.
- La materia de probacionismo ya está marcada con `materias.es_curso_probacion = true`.

**Alternatives considered**:
- Agregar campo `instructor_referencia_id` a `usuarios`: rechazado — viola el principio de no modificar esquema base para datos derivables.
- Query separada por probacionista (N+1): rechazado — viola FR-008 (carga eficiente).

---

### 2. Selección de la inscripción de referencia

**Decision**: Se toma la inscripción más reciente del Probacionista en una clase cuya materia tiene `es_curso_probacion = true`, ordenada por `inscripciones.fecha_inscripcion DESC`.

**Rationale**:
- La spec define explícitamente "última materia" como criterio.
- Si hay múltiples inscripciones, la más reciente refleja el historial académico más actual del Probacionista.

**Alternatives considered**:
- Usar `created_at` de la inscripción: equivalente pero menos semántico; `fecha_inscripcion` es el campo de dominio correcto.
- Tomar cualquier inscripción activa: rechazado — el Probacionista puede haberse dado de baja y tener otra inscripción posterior.

---

### 3. Estrategia de carga (N+1 prevention)

**Decision**: Extender `findPendingApproval()` para incluir en una sola query las inscripciones del Probacionista filtradas por materia de probacionismo, con `include` anidado hasta el `instructor` de la clase.

**Rationale**:
- Prisma soporta `include` con `where` anidado usando `take: 1` + `orderBy` para obtener solo la inscripción más relevante.
- Una sola query cubre todos los Probacionistas listados, cumpliendo FR-008.

**Approach**:
```
usuarios (Probacionistas)
  └─ inscripciones (where: clase.materia.es_curso_probacion=true, orderBy: fecha_inscripcion DESC, take: 1)
       └─ clase
            ├─ materia (select: nombre, es_curso_probacion)
            └─ instructor (select: id, nombre_completo)
```

---

### 4. Exposición en la API

**Decision**: Actualizar el endpoint `GET /users/pending-approval` para incluir el instructor de referencia en la respuesta. No se crea un endpoint nuevo.

**Rationale**: La bandeja de aprobación ya consume este endpoint; agregar el dato en la misma respuesta evita una segunda llamada desde el frontend.

**Alternatives considered**:
- Endpoint separado `GET /users/:id/probacion-instructor`: rechazado — generaría N llamadas desde el frontend (una por Probacionista).

---

### 5. Compatibilidad con Constitution

- **Data-First ✅**: No modifica el esquema base. Usa relaciones existentes.
- **Mobile-First ✅**: La bandeja de aprobación es una vista de escritorio admin; dato adicional no impacta UX móvil.
- **Modular ✅**: Solo extiende `findPendingApproval()`; no toca otros métodos.
- **Audit ✅**: No hay acción de escritura nueva; `updateInterview()` (spec 003) ya tiene log de auditoría.
- **Sessions ✅**: Usa el modelo de sesiones/clases existente para derivar el instructor.
