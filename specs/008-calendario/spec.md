# Feature Specification: Calendario

**Feature Branch**: `008-calendario`  
**Created**: 2026-04-06  
**Status**: Draft  
**Input**: User description: "Instructor Dashboard (Centralized view for teachers with calendars and management tools)"

## Clarifications

### Session 2026-04-25

- Q: ¿El calendario muestra horarios recurrentes, sesiones creadas, o un híbrido? → A: Solo lectura del día y hora de las clases activas, sin asociarlo a un mes o fecha específica — "calendario frío" que proyecta el patrón semanal recurrente de los `horarios` de clases activas.
- Q: ¿Qué ocurre al tocar/clic un bloque de clase? → A: Muestra un pop-up/modal con shortcuts: "Ir a pase de lista", "Ir a calificaciones", "Ver detalle de la clase".
- Q: ¿Cómo se organiza la vista del Escolástico con múltiples instructores? → A: Mismo calendario frío con todas las clases activas, bloques diferenciados por color según instructor.
- Q: ¿Cuál es el formato de visualización del calendario frío? → A: Grilla vertical por día (columnas = Lun–Sáb, filas = horas del día), bloques posicionados según hora inicio/fin de cada clase.
- Q: ¿Cuál debe ser el rango horario visible de la grilla? → A: Rango fijo 18:00–22:30.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Calendario Instructor (Priority: P1)

Como **instructor**, quiero visualizar un calendario de mis clases semanales en mi dispositivo móvil o escritorio, de acuerdo a la programacion de horario de mis clases, que me muestre el dia y hora ya pre programada. Esto desde una opcion del sidebar.

**Why this priority**: La Constitución menciona explícitamente "calendarios de instructores" como una herramienta de mejora operativa. Permite centralizar la navegación diaria.

**Independent Test**: Abrir la vista de calendario filtrada la el instructor logueado.

**Acceptance Scenarios**:

1. **Given** la vista de calendario, **When** el instructor selecciona un bloque de clase, **Then** el sistema muestra un menú emergente o modal con accesos directos a las funciones operativas de esa materia específica.
2. **Given** un dispositivo móvil, **When** el instructor consulta su calendario, **Then** el diseño debe ser responsive y permitir disparar acciones con un solo toque sobre el evento.

---

### User Story 2 - Calendario Escolastico (Priority: P1)

Como **escolastico**, quiero visualizar una vista semanal o mensual de todas las  clases desde la vista escritorio, para organizar el apoyo logistico del escolastico.

**Why this priority**: La Constitución menciona explícitamente "calendarios de instructores" como una herramienta de mejora operativa. Permite centralizar la navegación diaria.

**Independent Test**: Abrir la vista de calendario y verificar que al hacer clic en un bloque de clase para ver mayor info.

**Acceptance Scenarios**:

1. **Given** la vista de calendario, **When** el instructor selecciona un bloque de clase, **Then** el sistema muestra un menú emergente o modal con accesos directos a las funciones operativas de esa materia específica.
2. **Given** un dispositivo móvil, **When** el instructor consulta su calendario, **Then** el diseño debe ser responsive y permitir disparar acciones con un solo toque sobre el evento.

---

### Edge Cases

- **Múltiples Instructores**: Si una materia tiene más de un instructor, ambos deben ver la materia en sus respectivos dashboards con los mismos privilegios.
- **Cambio de Periodo**: El instructor debe poder consultar materias solo vigentes.
- **Sin Alumnos Inscritos**: La materia debe ser visible en el dashboard aunque no tenga alumnos todavía.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST proveer una vista de calendario frío para usuarios con rol `Instructor` (solo sus clases activas) y para `Escolástico` (todas las clases activas del sistema).
- **FR-002**: Para el rol `Escolástico`, los bloques de clase MUST diferenciarse visualmente por color según el instructor asignado, con una leyenda de referencia.
- **FR-003**: El sistema MUST mostrar una grilla semanal recurrente ("calendario frío") con columnas por día (Lun–Sáb) y filas con rango fijo 18:00–22:30. Cada clase activa se representa como un bloque posicionado según su hora de inicio y fin, sin asociarse a fechas o meses específicos.
- **FR-004**: Al tocar/clic un bloque de clase, el sistema MUST mostrar un pop-up o modal con shortcuts: "Ir a pase de lista", "Ir a calificaciones" y "Ver detalle de la clase".
- **FR-006**: La interfaz del dashboard MUST ser 100% responsive, priorizando la agilidad en dispositivos móviles.
- **FR-007**: El filtro de periodo académico se reemplaza por el estado de la clase: solo se muestran clases con estado `Activa`.

### Key Entities *(include if feature involves data)*

- **Dashboard**: Vista agregada que consume datos de Materia, Horario, Instructor e Inscripción.
- **Calendario**: Proyección temporal de los Horarios de las materias asignadas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El instructor accede a la lista de sus materias en menos de 1 segundo tras iniciar sesión.

### Assumptions

- **A-001**: Se asume que el instructor solo puede ver información de las materias en las que está formalmente asignado como docente.
- **A-002**: Se asume que el dashboard de escritorio puede ofrecer vistas más detalladas de estadísticas que la versión móvil.
