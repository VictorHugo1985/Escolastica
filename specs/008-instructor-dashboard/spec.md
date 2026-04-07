# Feature Specification: Instructor Dashboard

**Feature Branch**: `008-instructor-dashboard`  
**Created**: 2026-04-06  
**Status**: Draft  
**Input**: User description: "Instructor Dashboard (Centralized view for teachers with calendars and management tools)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Calendario Instructor (Priority: P1)

Como **instructorstico**, quiero visualizar un calendario de mis clases semanales en mi dispositivo móvil o escritorio, para organizar mi tiempo y acceder directamente a la gestión de la clase del día.

**Why this priority**: La Constitución menciona explícitamente "calendarios de instructores" como una herramienta de mejora operativa. Permite centralizar la navegación diaria.

**Independent Test**: Abrir la vista de calendario y verificar que al hacer clic en un bloque de clase, se muestren opciones rápidas para "Pasar Asistencia" o "Registrar Notas".

**Acceptance Scenarios**:

1. **Given** la vista de calendario, **When** el instructor selecciona un bloque de clase, **Then** el sistema muestra un menú emergente o modal con accesos directos a las funciones operativas de esa materia específica.
2. **Given** un dispositivo móvil, **When** el instructor consulta su calendario, **Then** el diseño debe ser responsive y permitir disparar acciones con un solo toque sobre el evento.

---

### User Story 1 - Calendario Escolastico (Priority: P1)

Como **escolastico**, quiero visualizar una vista semanal o mensual de todas las  clases desde la vista escritorio, para organizar el apoyo logistico del escolastico.

**Why this priority**: La Constitución menciona explícitamente "calendarios de instructores" como una herramienta de mejora operativa. Permite centralizar la navegación diaria.

**Independent Test**: Abrir la vista de calendario y verificar que al hacer clic en un bloque de clase, se muestren opciones rápidas para "Pasar Asistencia" o "Registrar Notas".

**Acceptance Scenarios**:

1. **Given** la vista de calendario, **When** el instructor selecciona un bloque de clase, **Then** el sistema muestra un menú emergente o modal con accesos directos a las funciones operativas de esa materia específica.
2. **Given** un dispositivo móvil, **When** el instructor consulta su calendario, **Then** el diseño debe ser responsive y permitir disparar acciones con un solo toque sobre el evento.

---

### User Story 3 - Quick Access to Attendance and Grades (Priority: P1)

Como **instructor**, quiero tener botones de acceso rápido desde la tarjeta de cada materia para tomar asistencia o registrar notas, de modo que minimice el número de clics necesarios para completar estas tareas.

**Why this priority**: Alineado con el principio de "mínima fricción" y diseño operacional mobile-first de la Constitución.

**Independent Test**: Verificar que desde la lista de materias del dashboard, existan accesos directos a las funciones de asistencia (spec 005) y notas (spec 006).

**Acceptance Scenarios**:

1. **Given** la tarjeta de una materia en el dashboard, **When** el instructor hace clic en "Pasar Asistencia", **Then** el sistema lo redirige directamente a la lista de alumnos para la fecha actual.

---

### User Story 4 - Student Roster and Profiles (Priority: P2)

Como **instructor**, quiero ver el listado de alumnos inscritos en mi clase y acceder a su información básica de contacto o académica (asistencia acumulada), para conocer mejor a mi grupo.

**Why this priority**: Mejora la gestión del grupo y permite al instructor tener contexto sobre la situación de cada alumno.

**Independent Test**: Abrir el listado de alumnos de una materia desde el dashboard del instructor y visualizar los porcentajes de asistencia por alumno.

**Acceptance Scenarios**:

1. **Given** el detalle de una materia en el dashboard, **When** el instructor selecciona "Ver Alumnos", **Then** el sistema muestra la lista de miembros inscritos con su estado (Activo/Baja) y su porcentaje de asistencia actual.

---

### Edge Cases

- **Múltiples Instructores**: Si una materia tiene más de un instructor, ambos deben ver la materia en sus respectivos dashboards con los mismos privilegios de edición.
- **Cambio de Periodo**: El instructor debe poder consultar materias de periodos pasados, pero con permisos de "solo lectura" una vez cerrado el periodo académico.
- **Sin Alumnos Inscritos**: La materia debe ser visible en el dashboard aunque no tenga alumnos todavía.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST proveer una vista centralizada (Dashboard) exclusiva para usuarios con rol de `Instructor`.
- **FR-002**: El sistema MUST listar todas las materias activas vinculadas al instructor para el periodo actual.
- **FR-003**: El sistema MUST incluir una vista de calendario semanal/mensual que refleje los horarios de las clases asignadas.
- **FR-004**: El dashboard MUST ofrecer accesos directos (shortcuts) a las funciones de pase de lista y registro de calificaciones.
- **FR-005**: El sistema MUST permitir al instructor visualizar el listado de alumnos de sus materias con estadísticas básicas (asistencia).
- **FR-006**: La interfaz del dashboard MUST ser 100% responsive, priorizando la agilidad en dispositivos móviles.
- **FR-007**: El sistema MUST permitir al instructor filtrar su lista de materias o calendario por periodos académicos.

### Key Entities *(include if feature involves data)*

- **Dashboard**: Vista agregada que consume datos de Materia, Horario, Instructor e Inscripción.
- **Calendario**: Proyección temporal de los Horarios de las materias asignadas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El instructor accede a la lista de sus materias en menos de 1 segundo tras iniciar sesión.
- **SC-002**: El 100% de las funcionalidades críticas (asistencia y notas) son accesibles con un máximo de 2 clics desde la pantalla principal del dashboard.
- **SC-003**: El calendario se sincroniza en tiempo real con cualquier cambio realizado en la Secretaría de Escolástica sobre los horarios.
- **SC-004**: La interfaz pasa las pruebas de usabilidad móvil (Google PageSpeed Insights > 90 en accesibilidad y buenas prácticas).

### Assumptions

- **A-001**: Se asume que el instructor solo puede ver información de las materias en las que está formalmente asignado como docente.
- **A-002**: Se asume que el dashboard de escritorio puede ofrecer vistas más detalladas de estadísticas que la versión móvil.
