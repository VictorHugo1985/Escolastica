# Tasks: Roles Múltiples por Usuario (Alcance Reducido)

Feature: **Roles Múltiples por Usuario**
Branch: `018-roles-multiples`

## Implementation Strategy
Este plan se enfoca en las validaciones de negocio para usuarios multi-rol y la correcta integración del flujo de creación de clases respetando la distinción entre Materia y Clase.

---

## Phase 1: Business Logic & Validations
Asegurar que las reglas de exclusividad y restricciones de inscripción se cumplan.

- [X] T001 [US4] Validar exclusividad de Probacionista/ExMiembro en el servicio de asignación de roles en `apps/api/src/users/users.service.ts`
- [X] T002 [US3] Implementar validación en el servicio de inscripciones para impedir que un Instructor se inscriba como alumno en su propia clase en `apps/api/src/clases/clases.service.ts`
- [X] T003 [P] [US3] Actualizar el método `getEligibleStudents` para que el instructor de la clase sea excluido automáticamente de la lista de candidatos en `apps/api/src/users/users.service.ts`

---

## Phase 2: Class Creation Flow (Materia vs Clase)
Refinar la interfaz y el backend para la creación de clases basada en el catálogo de materias.

- [X] T004 [P] Asegurar que el endpoint de creación de clases (`POST /clases`) requiera un `materia_id` válido y no cree materias duplicadas en `apps/api/src/clases/clases.service.ts`
- [X] T005 Actualizar el formulario de "Nueva Clase" en el frontend para que el primer paso sea la selección de una Materia del catálogo en `apps/web/src/app/(admin)/admin/clases/page.tsx`
- [X] T006 [P] Mostrar la información de la Materia vinculada (nombre, nivel) en el detalle y listado de Clases en `apps/web/src/app/(admin)/admin/clases/page.tsx`

---

## Final Phase: Validation & Testing
Verificación de los escenarios definidos.

- [ ] T007 Probar el flujo completo: Crear una clase -> Intentar inscribir al instructor como alumno (debe fallar) -> Inscribir al instructor en otra clase (debe funcionar).
- [ ] T008 Verificar que un usuario con múltiples roles (Escolástico + Instructor) mantiene acceso a ambas áreas sin conflictos.

---

## Dependencies
Phase 1 (Logic) -> Phase 2 (UI Flow) -> Final Phase

## Parallel Execution Examples
- T001 (Exclusividad) y T004 (Clases API) pueden desarrollarse simultáneamente.
- T003 (Eligible Students) y T006 (UI Listado Clases) afectan archivos distintos y pueden ser paralelos.
