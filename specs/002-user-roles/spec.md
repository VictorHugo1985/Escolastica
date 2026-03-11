# Feature Specification: Usuarios (Roles y Privilegios)

**Feature Branch**: `002-user-roles`  
**Created**: 2026-03-06  
**Status**: Draft  
**Input**: User description: "todos los usuarios al ser miembros pueden ser asignados a clases, inclusive si tambien son administradores y/o instructores"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gestión de Roles por Administrador (Priority: P1)

Como **administrador**, quiero poder crear y gestionar usuarios asignándoles los roles de "Instructor" o "Administrador" (siendo "Miembro" por defecto), para que cada persona tenga los accesos y privilegios adecuados según su función en la escuela.

**Why this priority**: Es la base del control de acceso. Define quién puede hacer qué en el sistema.

**Independent Test**: Desde el panel de administración, crear un usuario, verificar que es "Miembro" por defecto, asignarle el rol de "Instructor" y verificar que ahora puede ser seleccionado para impartir clases.

**Acceptance Scenarios**:

1. **Given** un nuevo registro de usuario, **When** el sistema procesa el registro, **Then** el usuario es automáticamente asignado como "Miembro".
2. **Given** un Administrador en el panel de gestión, **When** selecciona a un Miembro para ser Instructor, **Then** el sistema actualiza el registro y permite su asignación a materias (como docente).
3. **Given** un Administrador en el panel de gestión, **When** asigna el rol de Administrador a otro usuario, **Then** ese usuario adquiere privilegios de gestión general.

---

### User Story 2 - Inscripción Universal (Asignación a Clases como Miembro) (Priority: P1)

Como **escolástico o administrador**, quiero poder asignar a **cualquier usuario** del sistema (ya sea miembro, instructor o administrador) como alumno de una materia, basándome en su condición de "Miembro", para permitir que todo el personal de la escuela pueda cursar materias.

**Why this priority**: Refleja la naturaleza de la escuela donde instructores y administradores también pueden ser alumnos de otras materias.

**Independent Test**: Seleccionar una materia, buscar a un usuario con rol de "Administrador" e "Instructor", y verificar que el sistema permite añadirlo a la lista de alumnos asignados a esa materia.

**Acceptance Scenarios**:

1. **Given** la gestión de alumnos de una materia, **When** se busca personal para asignar, **Then** el sistema muestra a todos los usuarios registrados (ya que todos son miembros).
2. **Given** un usuario con roles de Admin e Instructor, **When** se le asigna como alumno a una clase, **Then** el sistema permite la asignación sin restricciones basadas en sus otros roles.

---

### User Story 3 - Restricción de Docencia (Asignación como Instructor) (Priority: P1)

Como **escolástico o administrador**, quiero que el sistema solo me permita asignar usuarios con el rol de "Instructor" para **impartir** materias o clases, para asegurar la integridad académica.

**Why this priority**: Garantiza que solo personal autorizado pueda figurar como responsable docente de una materia.

**Independent Test**: Intentar asignar un usuario que solo tiene el rol de "Miembro" como **titular/instructor** de una materia y verificar que el sistema lo impide.

**Acceptance Scenarios**:

1. **Given** la creación de una materia, **When** se selecciona el Instructor responsable, **Then** el sistema solo permite elegir usuarios que tengan el rol de "Instructor" activo.

---

### User Story 4 - Versatilidad del Administrador (Priority: P2)

Como **administrador**, quiero que mis privilegios de gestión sean independientes de mi participación en clases (como instructor o alumno), permitiéndome operar el sistema globalmente en cualquier escenario.

**Why this priority**: Asegura que el rol de gestión prevalezca y sea compatible con las funciones operativas.

**Independent Test**: Verificar que un administrador asignado como alumno en una materia sigue teniendo acceso a las herramientas de configuración general de la aplicación.

**Acceptance Scenarios**:

1. **Given** un Administrador asignado como alumno o instructor, **When** navega por el sistema, **Then** mantiene acceso a las funciones de auditoría y gestión de usuarios.

---

### Edge Cases

- ¿Qué pasa si un Instructor se inscribe a su propia clase? El sistema debería permitirlo técnicamente (ya que es miembro), aunque operativamente sea inusual.
- Baja de roles: Si a un usuario se le quita el rol de "Instructor", debe dejar de aparecer como elegible para *impartir* clases, pero seguir siendo elegible para *cursarlas* (como miembro).
- Roles múltiples: La lógica de permisos debe sumar privilegios, no restarlos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST considerar a todos los usuarios registrados como "Miembros" de forma inherente.
- **FR-002**: El sistema MUST permitir que CUALQUIER usuario (Miembro, Instructor o Administrador) sea asignado como alumno/asistente a una materia.
- **FR-003**: El sistema MUST restringir la asignación de **docentes responsables** de materias exclusivamente a usuarios con el rol de "Instructor".
- **FR-004**: El sistema MUST permitir que un usuario posea múltiples roles activos sin conflictos de permisos.
- **FR-005**: El sistema MUST proveer funciones de gestión general (configuración, auditoría, gestión de usuarios) únicamente a usuarios con el rol de "Administrador".

### Key Entities *(include if feature involves data)*

- **Usuario (Miembro)**: Entidad base. Todos pueden ser "alumnos" en una materia.
- **Instructor**: Rol que habilita ser "docente" de una materia.
- **Materia_Inscripcion**: Relación entre Usuario (como miembro) y Materia (como alumno).
- **Materia_Docencia**: Relación entre Usuario (como instructor) y Materia (como profesor).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los usuarios registrados pueden ser asignados como alumnos a cualquier materia.
- **SC-002**: La lista de selección de **profesores** filtra el 100% de los usuarios sin rol de Instructor.
- **SC-003**: Un usuario con roles de Admin, Instructor y Miembro puede ver su Kardex (alumno), gestionar sus clases (instructor) y administrar el sistema (admin) simultáneamente.
