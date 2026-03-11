# Feature Specification: Attendance Tracking

**Feature Branch**: `005-attendance-tracking`  
**Created**: 2026-03-10  
**Status**: Draft  
**Input**: User description: "Attendance Tracking (Mobile-first system for instructors to record attendance quickly)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quick Attendance Recording (Priority: P1)

Como **instructor en el aula**, quiero registrar la asistencia de mis alumnos desde mi dispositivo móvil de forma rápida y sencilla, para no perder tiempo de clase en tareas administrativas.

**Why this priority**: Es el pilar operativo del sistema según la Constitución. El enfoque mobile-first busca minimizar la fricción para el docente.

**Independent Test**: Abrir la vista de asistencia de una materia desde un dispositivo móvil, marcar a varios alumnos y guardar. Verificar que los registros se guarden correctamente en la base de datos.

**Acceptance Scenarios**:

1. **Given** un instructor en su dashboard móvil, **When** selecciona una materia con fecha actual seleccionada por defecto, **Then** el sistema muestra la lista de alumnos inscritos con opciones rápidas de marcado (ej. "Todos presentes").
2. **Given** la lista de alumnos, **When** el instructor sino marca nada esta asumido como "Ausente".
3. **Given** un instructor abre la lista del dia, **Then** la lista previamente cargada deberia mostrarse al instructor para seguir registrando asistencias.

---

### User Story 2 - Attendance History Review (Priority: P2)

Como **instructor o administrador**, quiero consultar el historial de asistencias de una materia específica para realizar un seguimiento del compromiso de los alumnos.

**Why this priority**: Permite la toma de decisiones pedagógicas y administrativas basadas en datos históricos.

**Independent Test**: Filtrar las asistencias por materia y rango de fechas, verificando que los resultados coincidan con los registros previos.

**Acceptance Scenarios**:

1. **Given** el panel de gestión de una materia, **When** se consulta el historial de asistencias, **Then** el sistema muestra un resumen por fecha, % general de asistencia mediante linea de tiempo y el detalle de quién asistió a cada sesión.
2. **Given** un alumno específico, **When** se consulta su ficha, **Then** el sistema muestra su porcentaje de asistencia en la materia actual.

---

### User Story 3 - Automated Attendance Summary (Priority: P3)

Como **miembro (alumno)**, quiero ver mi propio registro de asistencias en mi dashboard, para estar al tanto de mi situación académica y cumplir con los requisitos de la materia.

**Why this priority**: Fomenta la transparencia y la responsabilidad del alumno.

**Independent Test**: Iniciar sesión como alumno y verificar que la sección de "Mis Asistencias" muestre los datos correctos para sus materias inscritas.

**Acceptance Scenarios**:

1. **Given** un alumno autenticado, **When** accede a su Kardex o vista de materia, **Then** el sistema muestra el número total de clases, sus asistencias, faltas y retardos.

---

### Edge Cases

- **Clase en día no programado**: El sistema permite tomar asistencia en cualquier fecha para contemplar recuperaciones de clase.
- **Cambio de estado posterior**: El instructor puede corregir asistencias pasadas; el sistema registrará quién realizó el cambio para auditoría.
- **Sin conexión a internet**: El sistema requiere una conexión activa a internet para registrar la asistencia (Operación Online Only). Si no hay conexión, el usuario recibirá un aviso de error al intentar guardar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST ofrecer una interfaz optimizada para móviles (Mobile-First) para el registro de asistencias.
- **FR-002**: El sistema MUST permitir marcar estados de: Presente y Justificado.
- **FR-003**: El sistema MUST permitir el registro de asistencia por fecha (por defecto la actual).
- **FR-004**: El sistema MUST permitir el marcado masivo (ej. "Marcar todos como presentes") para agilizar el proceso.
- **FR-005**: El sistema MUST vincular cada registro de asistencia a una Inscripción (Usuario-Materia) y a una fecha específica.
- **FR-006**: El sistema MUST permitir a los administradores e instructores editar registros de asistencia existentes.
- **FR-007**: El sistema MUST calcular automáticamente el porcentaje de asistencia por alumno y materia.

### Key Entities *(include if feature involves data)*

- **Asistencia**: Fecha, estado (Presente/Ausente/Justificado), observación opcional.
- **Inscripción**: Vínculo necesario para saber qué alumnos deben figurar en la lista de asistencia.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un instructor puede completar el pase de lista para una clase de 20 alumnos en menos de 30 segundos desde su móvil.
- **SC-002**: El 100% de los cambios en asistencias pasadas deben quedar registrados con el ID del usuario que realizó la modificación (auditoría).
- **SC-003**: La interfaz móvil debe tener un tiempo de carga inferior a 1 segundo para la lista de alumnos.
- **SC-004**: El sistema debe reflejar los cambios de asistencia en el Kardex del alumno de forma instantánea tras guardar.

### Assumptions

- **A-001**: Se asume que el instructor tiene una conexión a internet estable durante el pase de lista (operación online por defecto).
- **A-002**: Se asume que no hay límite estricto de cuántas veces se puede tomar asistencia en un mismo día para una materia (ej. materias con bloques dobles).
