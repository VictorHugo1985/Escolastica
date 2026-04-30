# Feature Specification: Escolástico con Privilegios Plenos de Asistencia

**Feature Branch**: `024-asistencia-privilegios-escolastico`  
**Created**: 2026-04-24  
**Status**: Draft  
**Input**: User description: "incluir en el spec.md de 005-registro-asistencia la funcionalidad de creacion de sesiones de clases y registro de asistencia con los mismos privilegios como si fuera el instructor"

## Clarifications

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Escolástico crea sesión y toma asistencia (Priority: P1)

Como **Escolástico**, quiero poder crear sesiones para cualquier clase y registrar la asistencia de sus alumnos exactamente igual que lo haría el instructor titular, para cubrir ausencias docentes o gestionar administrativamente el registro sin depender del instructor.

**Why this priority**: Es un requisito operativo crítico: si el instructor falta, el Escolástico debe poder cubrir el registro de asistencia sin bloqueos del sistema. También permite control administrativo directo sobre cualquier clase.

**Independent Test**: Iniciar sesión como Escolástico, navegar al pase de lista de una clase asignada a otro instructor, crear una nueva sesión del día y registrar asistencias para todos los alumnos inscritos. Verificar que la sesión queda registrada correctamente y que los registros de auditoría muestran al Escolástico como creador.

**Acceptance Scenarios**:

1. **Given** un Escolástico autenticado, **When** accede al pase de lista de cualquier clase (independientemente del instructor asignado), **Then** el sistema le muestra la misma interfaz de creación de sesión y marcado de asistencias que ve el instructor titular.
2. **Given** el Escolástico está en la vista de pase de lista, **When** inicia la sesión del día, **Then** el sistema crea la sesión de forma idéntica a como lo haría el instructor, con el Escolástico registrado como creador en el log de auditoría.
3. **Given** el pase de lista del día ya tiene asistencias cargadas (por el instructor u otro Escolástico), **When** el Escolástico abre esa sesión, **Then** el sistema muestra los estados ya cargados para que pueda continuar editando o completar registros faltantes.

---

### Edge Cases

- **Doble registro simultáneo**: Si el instructor y el Escolástico intentan registrar asistencia al mismo tiempo para la misma sesión, el sistema aplica el último guardado como estado vigente (last-write-wins) y deja ambas acciones en auditoría.
- **Clase Finalizada**: El Escolástico no puede crear nuevas sesiones para clases con estado `Finalizada`, igual que el instructor.
- **Clase sin alumnos inscritos**: Si la clase no tiene inscripciones activas, el sistema informa claramente al Escolástico al intentar abrir el pase de lista.

## Requirements *(mandatory)*

### Functional Requirements

Estos requisitos extienden la spec 005-registro-asistencia:

- **FR-011**: El sistema MUST permitir al rol **Escolástico** crear sesiones del día para cualquier clase activa, con los mismos permisos que el instructor titular de esa clase.
- **FR-012**: El sistema MUST mostrar al Escolástico la misma interfaz de pase de lista (creación de sesión, marcado masivo, marcado individual, edición de estados) que se muestra al instructor.
- **FR-013**: El sistema MUST registrar en los logs de auditoría el ID del Escolástico como actor cuando este crea sesiones o modifica asistencias, diferenciándolo del instructor titular.
- **FR-014**: La opción **"Pase de lista"** en la barra de navegación lateral MUST mostrar al Escolástico todas las clases activas del sistema (no solo las propias), con las mismas opciones de acceso que el instructor para cada una.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-005**: El Escolástico puede completar el pase de lista de cualquier clase (incluyendo las de otros instructores) en el mismo tiempo que un instructor: menos de 30 segundos para 20 alumnos.
- **SC-006**: El 100% de las sesiones creadas por un Escolástico deben quedar registradas en auditoría con el ID del Escolástico como actor.
- **SC-007**: Ninguna funcionalidad de creación o edición de asistencias disponible para el instructor debe estar restringida para el Escolástico.

### Assumptions

- **A-001**: Se asume que el Escolástico ya está autenticado y tiene acceso a la vista de clases del sistema.
- **A-002**: El modelo de permisos del sistema reconoce al Escolástico como superconjunto del Instructor en todas las operaciones de asistencia.
- **A-003**: No se requiere una aprobación adicional del instructor para que el Escolástico tome asistencia en su clase.

### Dependencies

- **Spec 005**: Este spec extiende directamente `005-registro-asistencia`. Los FR-011 a FR-014 deben ser incorporados en esa spec como parte de la misma implementación.
- **Spec 003**: El rol `Escolastico` está definido en spec 003 y tiene acceso web confirmado en esta versión MVP.
