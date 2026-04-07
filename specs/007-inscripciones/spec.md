B# Feature Specification: Enrollment Movements

**Feature Branch**: `007-inscripciones`  
**Created**: 2026-03-10  
**Status**: Draft  
**Input**: User description: "Enrollment Movements (Management of student enrollments and withdrawals with strict history)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register New Enrollment (Alta) (Priority: P1)

Como **personal de Secretaría de Escolástica**, quiero inscribir a un miembro en una materia para el periodo actual, de modo que pueda comenzar a asistir a clases y ser evaluado.

**Why this priority**: Es la base del flujo académico. Sin el registro de "Alta", el alumno no figura en las listas de asistencia ni en el sistema de notas.

**Independent Test**: Realizar una inscripción de un usuario en una materia y verificar que su estado sea "Activo" y que la fecha de alta sea la actual por defecto.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** selecciona un miembro y una materia para inscribirlo, **Then** el sistema crea un nuevo registro de inscripción con estado "Activo".
2. **Given** un miembro ya inscrito en una materia para el mismo periodo, **When** se intenta inscribir nuevamente, **Then** el sistema impide la duplicidad.

---

### User Story 2 - Register Withdrawal (Baja) (Priority: P1)

Como **personal de Secretaría**, quiero registrar la baja de un alumno de una materia específica, indicando el motivo y la fecha, para mantener el historial académico veraz y liberar el cupo si fuera necesario.

**Why this priority**: La Constitución exige explícitamente un histórico de bajas por alumno y materia. Es crítico para auditoría y reportes.

**Independent Test**: Dar de baja a un alumno inscrito y verificar que su registro de inscripción cambie a estado "Baja" y que la fecha de baja quede registrada.

**Acceptance Scenarios**:

1. **Given** un alumno con estado "Activo" en una materia, **When** el administrador registra la baja, **Then** el sistema actualiza el estado a "Baja" y solicita obligatoriamente seleccionar un motivo de una lista predefinida (ej. Motivos personales, Falta de tiempo, Cambio de horario).
2. **Given** un alumno en estado "Baja", **When** el instructor intenta tomar asistencia, **Then** el alumno ya no debe aparecer en la lista de asistencia vigente.

---

### User Story 3 - View Movement History (Priority: P1)

Como **administrador**, quiero consultar el historial completo de movimientos (altas y bajas) de un alumno o de una materia, para entender la trayectoria académica y las razones de deserción.

**Why this priority**: Permite el análisis administrativo y la toma de decisiones basada en el comportamiento histórico de los alumnos.

**Independent Test**: Consultar el Kardex o ficha de una materia y verificar que se listen tanto las altas vigentes como las bajas históricas.

**Acceptance Scenarios**:

1. **Given** la ficha de un alumno, **When** se consulta su historial de movimientos, **Then** el sistema muestra una tabla con Materia, Fecha Alta, Fecha Baja (si aplica) y Motivo de Baja.

---

### User Story 4 - Registro de aprobacion de clase y conclusion de materia (Priority: P1)

Como **escolastico**, quiero  incluir en la inscripcion del alumno un campo que indique si aprobo o no la clase y otro campo que indique si aprobo se la materia concluyo.


**Acceptance Scenarios**:

1. **Given** la configuración global de evaluación, **When** el administrador define la escala (ej. 0-100) y el mínimo (ej. 70), **Then** el sistema aplica estas validaciones en el registro de notas de todos los instructores.


### Edge Cases

- **Re-inscripción tras Baja**: Si un alumno que se dio de baja desea volver a inscribirse en la misma materia dentro del mismo periodo académico, el sistema reactivará el registro anterior cambiando su estado de "Baja" a "Activo".
- **Baja Retroactiva**: Un administrador puede registrar una baja con fecha anterior a la actual para corregir errores, quedando esto registrado en el log de auditoría.
- **Inscripción en Periodos Pasados**: El sistema impide terminantemente crear inscripciones nuevas en periodos académicos que ya han sido cerrados.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir el registro de "Altas" de alumnos en materias.
- **FR-002**: El sistema MUST permitir el registro de "Bajas" de alumnos en materias, manteniendo el registro histórico.
- **FR-003**: El sistema MUST requerir una fecha de movimiento para cada alta y baja.
- **FR-004**: El sistema MUST impedir que un alumno sea dado de baja si ya tiene el estado de "Finalizado" o "Aprobado".
- **FR-005**: El sistema MUST proveer una lista predefinida de motivos para el registro de bajas (Enum `motivo_gral`: 'Ausencia', 'Licencia', 'Sin reportar').
- **FR-006**: El sistema MUST asegurar que las bajas se reflejen inmediatamente en las listas de asistencia del instructor, ocultando al alumno para futuras sesiones.
- **FR-007**: El sistema MUST permitir filtrar movimientos por rango de fechas, materia o alumno.
- **FR-008**: Al registrar una baja, el sistema MUST preservar todas las asistencias y notas previas para fines de auditoría e historial.
- **FR-009**: Cada movimiento de inscripción MUST generar automáticamente un registro en la tabla `logs_auditoria`.

### Key Entities *(include if feature involves data)*

- **Inscripción**: Vínculo entre alumno y clase. Atributos: ID Usuario, ID Clase, Fecha Inscripción, Fecha Baja, Motivo Baja, Estado (Activo, Baja, Finalizado).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las bajas registradas deben conservar la fecha y el motivo seleccionado en la base de datos.
- **SC-002**: El tiempo para registrar un alta o baja debe ser inferior a 10 segundos para el administrador.
- **SC-003**: El historial de movimientos debe ser inalterable (log de auditoría estricto de cambios).
- **SC-004**: Menos de 500ms para cargar el historial de movimientos de un alumno con hasta 50 registros.

### Assumptions

- **A-001**: Se asume que una baja no implica borrar las asistencias o notas parciales ya registradas, solo detiene el registro futuro.
- **A-002**: Se asume que el administrador tiene la autoridad final para corregir fechas de movimientos mediante el flujo de edición restringido.
