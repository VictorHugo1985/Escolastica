# Feature Specification: Roles Múltiples por Usuario (Alcance Reducido)

**Feature Branch**: `018-roles-multiples`
**Created**: 2026-04-23
**Status**: Draft
**Input**: User description: "Foco en compatibilidad de inscripciones y exclusividad de probacionista, junto con distinción Materia/Clase."

## Clarifications

### Session 2026-04-23
- Q: ¿Cómo se manejan los solapamientos de horario para usuarios con múltiples roles (ej. Instructor y Alumno)? → A: Sin Validación (El sistema permite el solapamiento; la gestión de agenda es responsabilidad del usuario y la Secretaría).
- Q: ¿Qué validación se aplica a la capacidad del aula frente al número de inscritos? → A: Informativo (La capacidad es un dato de referencia; no se realiza validación ni advertencia).
- Q: ¿Debe el sistema formalizar la distinción entre Materia y Clase? → A: Separación Clara (La Materia es el catálogo/molde y la Clase es la instancia específica con instructor y horarios).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compatibilidad con Inscripciones como Alumno (Priority: P1)

Como **escolástico**, quiero que un usuario con rol de Instructor también pueda ser inscrito como alumno en clases que no imparte, manteniendo la restricción de no poder ser alumno de su propia clase.

**Why this priority**: Los docentes también son miembros de la escuela y pueden cursar otras materias.

**Independent Test**: Inscribir como alumno a un usuario Instructor en una clase que no imparte. Verificar que el sistema lo permite. Intentar inscribirlo en su propia clase y verificar que el sistema lo bloquea.

**Acceptance Scenarios**:

1. **Given** un usuario con rol Instructor, **When** se intenta inscribirlo como alumno en una clase que él no imparte, **Then** el sistema permite la inscripción.
2. **Given** un usuario con rol Instructor, **When** se intenta inscribirlo en una clase de la cual es titular, **Then** el sistema bloquea la inscripción con un mensaje de error claro.

---

### User Story 2 - Exclusividad del Rol Probacionista (Priority: P1)

Como **sistema**, debo garantizar que el rol de Probacionista es incompatible con cualquier otro rol, ya que representa un estado previo a la membresía con restricciones de acceso propias.

**Why this priority**: Combinar Probacionista con otro rol generaría permisos contradictorios.

**Independent Test**: Intentar asignar un rol adicional a un usuario Probacionista. Verificar que el sistema rechaza la operación.

**Acceptance Scenarios**:

1. **Given** un usuario con rol Probacionista, **When** el Escolástico intenta asignarle cualquier otro rol, **Then** el sistema rechaza la operación.
2. **Given** un usuario con rol Miembro, Instructor o Escolástico, **When** el Escolástico intenta asignarle el rol de Probacionista, **Then** el sistema rechaza la operación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST evaluar el acceso a cualquier función verificando si el usuario posee **al menos uno** de los roles requeridos (lógica aditiva).
- **FR-002**: El sistema MUST considerar elegible como alumno de una clase a cualquier usuario que tenga al menos uno de los roles Miembro, Instructor o Escolástico activos, siempre que no sea el titular de esa misma clase.
- **FR-003**: El sistema MUST rechazar la inscripción de un usuario en una clase si este es el instructor asignado a la misma.
- **FR-004**: El sistema MUST mantener la exclusividad de los roles Probacionista y ExMiembro en todas las operaciones de asignación.
- **FR-005**: El sistema MUST permitir la creación de `Clases` seleccionando una `Materia` del catálogo existente, asignando un Instructor, Aula y Horarios específicos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los intentos de inscribir a un instructor en su propia clase son bloqueados.
- **SC-002**: Un usuario con múltiples roles puede acceder a las funciones de todos sus roles activos en la misma sesión.
- **SC-003**: La UI de creación de clases obliga a seleccionar una Materia existente antes de definir los detalles de la clase.

## Assumptions

- La distinción estructural entre `materias` y `clases` ya existe en el esquema de base de datos.
- Las funciones de asignación y revocación de roles (US1 y US2) ya están operativas o fuera de este alcance.
