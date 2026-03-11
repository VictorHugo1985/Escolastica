# Feature Specification: Subject Management

**Feature Branch**: `004-subject-management`  
**Created**: 2026-03-10  
**Status**: Draft  
**Input**: User description: "Subject Management (Management of subjects, schedules, and link between Instructors and Members)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Manage Subjects (Priority: P1)

Como **administrador de la Secretaría de Escolástica**, quiero registrar y configurar nuevas materias (nombre, descripción, periodo académico) para organizar los cursos de la escuela.

**Why this priority**: Es el punto de partida para cualquier actividad académica. Sin materias registradas, no se pueden asignar instructores ni inscribir alumnos.

**Independent Test**: Verificar que un administrador pueda crear una materia, editar sus datos básicos y que estos persistan correctamente en la base de datos.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** completa el formulario de nueva materia con datos válidos, **Then** el sistema crea la materia y la muestra en el listado general.
2. **Given** una materia existente, **When** el administrador modifica su descripción, **Then** el sistema actualiza el registro y muestra la nueva información.

---

### User Story 2 - Assign Instructor to Subject (Priority: P1)

Como **administrador**, quiero asignar a uno o más instructores responsables a una materia, para que ellos puedan gestionar las asistencias y notas de sus alumnos.

**Why this priority**: Define la responsabilidad docente y habilita el acceso de los instructores a sus clases en sus dashboards personales.

**Independent Test**: Asignar un usuario con rol de "Instructor" a una materia y verificar que la relación se establezca correctamente.

**Acceptance Scenarios**:

1. **Given** una materia creada, **When** el administrador selecciona un usuario con rol de "Instructor" de la lista de candidatos, **Then** el sistema vincula al instructor con la materia.
2. **Given** la lista de candidatos a instructor, **When** el administrador busca un usuario, **Then** el sistema solo muestra usuarios que tengan el rol de "Instructor" activo (según spec 002).

---

### User Story 3 - Schedule Management (Priority: P2)

Como **administrador**, quiero definir los días y horarios en los que se imparte una materia, para que los instructores y alumnos tengan claridad sobre su calendario.

**Why this priority**: Permite la organización del tiempo y evita solapamientos de clases en el calendario institucional.

**Independent Test**: Definir un horario semanal para una materia y verificar que se visualice correctamente en el detalle de la misma.

**Acceptance Scenarios**:

1. **Given** una materia, **When** el administrador agrega un bloque horario (ej. Lunes de 19:00 a 21:00), **Then** el sistema guarda el horario y lo asocia a la materia.
2. **Given** un horario asignado, When se intenta solapar con otro horario en la misma "aula" o para el mismo instructor (si aplica la restricción), Then el sistema advierte sobre el conflicto pero permite guardar el registro para mantener flexibilidad operativa.

---

### User Story 4 - Member Enrollment (Priority: P1)

Como **administrador o personal de Escolástica**, quiero inscribir a miembros en una materia específica para que puedan asistir a clase y ser evaluados.

**Why this priority**: Es fundamental para el control de asistencia y el registro de notas. Sin inscripciones, la operatividad diaria de la clase no es posible.

**Independent Test**: Inscribir a un miembro en una materia y verificar que aparezca en la lista de alumnos de dicha materia.

**Acceptance Scenarios**:

1. **Given** una materia activa, **When** el administrador busca a un miembro por nombre o correo y lo añade, **Then** el sistema crea la inscripción con estado "Activo".
2. **Given** el proceso de inscripción, **When** se busca personal para inscribir, **Then** el sistema permite seleccionar a cualquier usuario registrado (ya que todos son miembros inherentes).

---

### Edge Cases

- **Materia sin Instructor**: El sistema debe permitir crear la materia y dejarla "pendiente de asignación" de instructor.
- **Inscripción Duplicada**: El sistema debe impedir que un mismo miembro sea inscrito dos veces en la misma materia para el mismo periodo.
- **Cambio de Instructor**: Si se cambia el instructor de una materia, los registros de asistencia y notas previos deben permanecer íntegros.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir la creación, lectura, actualización y desactivación (CRUD) de Materias.
- **FR-002**: El sistema MUST validar que solo usuarios con rol de `Instructor` puedan ser asignados como docentes de una materia.
- **FR-003**: El sistema MUST permitir la inscripción de cualquier usuario (Miembro) en una materia.
- **FR-004**: El sistema MUST permitir definir múltiples bloques horarios para una sola materia (ej. Martes y Jueves).
- **FR-005**: El sistema MUST mantener un estado de la inscripción (Activo, Baja, Finalizado).
- **FR-006**: El sistema MUST permitir filtrar materias por nombre, instructor o periodo académico.
- **FR-007**: El sistema MUST permitir registrar los temas por materias, no obligatorio.

### Key Entities *(include if feature involves data)*

- **Materia**: Nombre, código opcional, descripción, periodo académico, nivel, temas, estado (Activa/Inactiva).
- **Horario**: Día de la semana, hora de inicio, hora de fin, ubicación/aula (opcional).
- **Inscripción**: Vínculo entre Usuario y Materia, fecha de inscripción, estado.
- **Asignación Docente**: Vínculo entre Usuario (Instructor) y Materia.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un administrador puede registrar una nueva materia y asignarle un instructor en menos de 1 minuto.
- **SC-002**: El sistema impide el 100% de los intentos de asignar como docente a un usuario que no tenga el rol de "Instructor".
- **SC-003**: El listado de alumnos de una materia se carga en menos de 500ms para clases de hasta 100 miembros.
- **SC-004**: El 100% de las materias deben registrar un codigo correlativo por un periodo académico, por ej NOMBREMATERIA-01-2026.

### Assumptions

- **A-001**: Se asume que por ahora no hay validación estricta de solapamiento de aulas físicas, solo advertencia.
