# Feature Specification: Grades and Kardex

**Feature Branch**: `006-grades-kardex`  
**Created**: 2026-03-10  
**Status**: Draft  
**Input**: User description: "Grades and Kardex (Recording of exam results and generation of individual academic records/Kardex)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registro de notas por Clase (Priority: P1)

Como **instructor o escolastico**, quiero registrar las notas finales de las clases de mis alumnos de forma ágil desde la web (móvil o escritorio), para mantener actualizado el progreso académico.

**Why this priority**: Es la función operativa crítica para la evaluación. Sin registro de notas, no se puede generar el Kardex ni certificar el aprovechamiento de las materias.

**Independent Test**: Acceder a la sección de notas de una clase, ingresar calificaciones para varios alumnos y guardar. Verificar que las notas se reflejen en la base de datos vinculadas a la inscripción del alumno.

**Acceptance Scenarios**:

1. **Given** un instructor en su panel de clase, **When** selecciona la opción de inscritos **Then** el sistema muestra todos los inscritos y para cada uno hay que ingresar y registar su nota final.
2. **Given** una nota ingresada, **When** el instructor intenta guardar, **Then** el sistema obtiene la lista de calificaciones posibles, ej.: EB, BO, EX, ME, ETC (Esta lista de calificaciones tiene que ser parametrizable y tener codigo y descripcion, aplica para todas las materias).

---

### User Story 3 - Administrative Academic Review (Priority: P2)

Como **personal de Secretaría de Escolástica**, quiero consultar el Kardex de cualquier alumno y generar un reporte de su situación académica, para fines de auditoría o certificación interna.

**Why this priority**: Facilita la labor administrativa de control y seguimiento global de los alumnos.

**Independent Test**: Buscar a un alumno desde el panel administrativo y visualizar su Kardex completo.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** busca un alumno por nombre o ID y selecciona "Ver Kardex", **Then** el sistema muestra la misma información que el alumno pero con herramientas adicionales de edición (si fuera necesario corregir errores).

---

### Edge Cases

- **Bajas con Notas**: Si un alumno tiene estado de "Baja" en una materia, este estado prevalece en el Kardex aunque existan notas parciales registradas.
- **Recuperaciones/Extraordinarios**: El sistema registrará cada intento de examen o cursada como una línea separada en el historial académico, permitiendo ver la evolución del alumno.
- **Materias sin Nota**: Para materias de solo asistencia, el sistema permite registrar un estado de "Acreditado" que se visualiza en el Kardex sin calificación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir a los instructores registrar y editar notas para los alumnos inscritos en sus materias.
- **FR-002**: El sistema MUST validar que las notas se encuentren en el listado predefinido.
- **FR-003**: El sistema MUST generar una vista de Kardex que consolide la trayectoria académica de cada Usuario (Miembro).
- **FR-004**: El Kardex MUST incluir: nombre de la materia, periodo académico, nota final, porcentaje de asistencia, comentario y estado final.
- **FR-005**: El sistema MUST permitir filtrar el Kardex por periodos académicos o estados de materia.
- **FR-006**: El sistema MUST permitir al administrador realizar el cierre manual de la edición de notas por materia para asegurar la integridad de las actas. 
- **FR-007**: El sistema MUST reflejar las bajas (históricas) en el Kardex según lo estipulado en la Constitución.

### Key Entities *(include if feature involves data)*

- **Nota**: Nota de lista predefinida, tipo de evaluación, fecha de registro e instructor responsable.
- **Kardex**: Vista consolidada de la trayectoria académica del usuario.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El Kardex de un alumno con 20 materias inscritas debe cargar en menos de 800ms.
- **SC-002**: El 100% de los registros de notas deben estar vinculados a un usuario `Instructor` (autoría) y a un registro de `Inscripcion`.
- **SC-003**: Los alumnos pueden acceder a su Kardex las 24 horas del día con una disponibilidad del 99.9%.
- **SC-004**: El sistema previene el ingreso de notas inválidas en el 100% de los casos mediante validaciones en el backend.

### Assumptions

- **A-001**: Se asume que el Kardex es una vista en tiempo real de los datos en la base de datos relacional.
