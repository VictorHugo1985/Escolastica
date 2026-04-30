# Research: Escolástico con Privilegios Plenos de Asistencia

**Feature**: `024-asistencia-privilegios-escolastico`  
**Date**: 2026-04-24

## Decision 1: Estrategia para extender `findClasesHoy`

**Decision**: Agregar parámetro `roles: string[]` a `findClasesHoy`. Cuando `roles.includes('Escolastico')` el filtro `instructor_id` se omite; el filtro por `dia_semana` se mantiene en ambos casos para conservar el contexto de "clases de hoy".

**Rationale**: La mínima superficie de cambio. La lógica del instructor no cambia. No se duplica el método ni se agrega una ruta nueva. El JWT ya expone `req.user.roles` como array de strings desde el guard existente (`jwt.strategy.ts`).

**Alternatives considered**:
- Método separado `findTodasClasesHoy()`: duplicaría la query con diferencia de un where-clause — innecesario.
- Parámetro booleano `isEscol: boolean`: menos expresivo y acoplado a un rol específico en la firma.
- Endpoint separado `GET /clases/hoy/todas`: requeriría cambio en frontend — evitable.

---

## Decision 2: Filtro por día de semana para el Escolástico

**Decision**: Mantener el filtro `dia_semana` también para el Escolástico. "Todas las clases activas del sistema" en FR-014 significa todas las que tengan sesión hoy, no el catálogo completo de clases. Para acceder a cualquier clase fuera de su horario, el Escolástico ya puede ir a `/admin/clases` y crear sesión desde ahí.

**Rationale**: El endpoint `GET /clases/hoy` es para el pase de lista rápido del día. Devolver todo el catálogo de clases en ese endpoint quebraría el flujo UX mobile-first. El admin ya tiene acceso completo vía `GET /clases` del ClasesController.

**Alternatives considered**:
- Sin filtro por día para Escolástico: retornaría decenas de clases irrelevantes en el pase de lista.

---

## Decision 3: Auditoría — sin cambios requeridos

**Decision**: No se modifican los métodos de auditoría. `bulkUpsert(actorId, ...)` y `updateOne(actorId, ...)` ya reciben `req.user.id` desde el controlador. Cuando el actor es Escolástico, su UUID queda registrado automáticamente. FR-013 está cubierto por la implementación existente.

**Rationale**: El sistema de auditoría es role-agnostic — registra quien ejecuta la acción, no el rol. Alineado con spec 012.

---

## Decision 4: Frontend — sin cambios

**Decision**: Las páginas `(admin)/admin/asistencia/page.tsx` e `(instructor)/asistencia/page.tsx` ya llaman a `GET /clases/hoy`. Cuando el API devuelva todas las clases del día para el Escolástico, la UI las mostrará sin modificación. No se requieren cambios en frontend para cumplir los FRs.

**Rationale**: El cambio está encapsulado en el servicio backend. La UI es data-driven.
