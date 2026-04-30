# Feature Specification: Attendance Tracking

**Feature Branch**: `005-registro-asistencia`  
**Created**: 2026-03-10  
**Status**: Draft  
**Input**: User description: "Attendance Tracking (Mobile-first system for instructors to record attendance quickly)"

## Clarifications

### Session 2026-04-21

- Q: ¿Los estados de asistencia son 'Presente'/'Ausente'/'Licencia' o 'Presente'/'Justificado'? → A: 3 estados: `'Presente'`, `'Ausente'`, `'Licencia'`, alineado con spec 002 (diccionario master). 'Licencia' reemplaza a 'Justificado'.

### Session 2026-04-23

- Q: ¿Dónde deben aparecer las vistas de asistencia y Kardex en la navegación? → A: Pase de lista y Historial de asistencias deben aparecer en la sidebar para roles Instructor y Escolástico. Kardex debe aparecer para todos los usuarios autenticados.

### Session 2026-04-24

- Q: ¿El Escolástico puede crear sesiones y registrar asistencia con los mismos privilegios que un Instructor? → A: Sí. El Escolástico tiene paridad total con el Instructor para crear sesiones y registrar/editar asistencias en cualquier clase activa del sistema, sin restricciones por instructor asignado. Ver spec 024 para detalle.

### Session 2026-04-24 (Gestión de sesiones)

- Q: En el historial de sesiones, ¿qué puede hacer el usuario al seleccionar una sesión pasada? → A: Ver + editar asistencias (abrir pase de lista con estados guardados para corregir) + editar metadatos de la sesión (tipo, tema, comentarios).
- Q: ¿Dónde y cuándo se muestra la fecha/día al crear una sesión? → A: Sin paso de confirmación extra. La fecha completa y el día de la semana se muestran en el header del pase de lista una vez creada la sesión (ej. subtitle: "Lunes 24 de Abril de 2026").
- Q: ¿Desde dónde accede el usuario a la gestión de sesiones de una clase (US4)? → A: Desde la lista de clases vigentes (`/admin/asistencia`): al seleccionar una clase se abre una pantalla dedicada de gestión de sesiones para esa clase, que muestra el historial cronológico y permite crear una nueva sesión o abrir una existente para editar asistencia y metadatos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registro rapido de asistencia (Priority: P1)

Como **instructor o escolástico**, quiero registrar la asistencia de los alumnos de una clase desde mi dispositivo móvil de forma rápida y sencilla, para no perder tiempo de clase en tareas administrativas.

**Why this priority**: Es el pilar operativo del sistema según la Constitución. El enfoque mobile-first busca minimizar la fricción para el docente.

**Independent Test**: Abrir la vista de asistencia de una materia desde un dispositivo móvil, marcar a varios alumnos y guardar. Verificar que los registros se guarden correctamente en la base de datos vinculados al actor que los registró.

**Acceptance Scenarios**:

1. **Given** un instructor o escolástico en su móvil, **When** abre la aplicación, el sistema filtra automáticamente según el día de la semana las clases que le corresponden (para el instructor: sus propias clases; para el escolástico: todas las clases activas del sistema), **Then** el actor selecciona una clase con fecha actual por defecto y el sistema muestra la lista de alumnos inscritos con opciones rápidas de marcado (ej. "Todos presentes").
2. **Given** la lista de alumnos, **When** el actor no marca a un alumno, el sistema asume estado "Ausente" para ese alumno al guardar.
3. **Given** un actor abre la lista de asistencia del día, **Then** si hubo carga de asistencia previa debe mostrarse para continuar registrando o editar estados existentes.

---

### User Story 1b - Escolástico crea sesión y toma asistencia en cualquier clase (Priority: P1)

Como **Escolástico**, quiero poder crear sesiones y registrar asistencia para cualquier clase activa del sistema (no solo las que me son asignadas como instructor), para cubrir ausencias docentes o ejercer supervisión administrativa directa sin depender del instructor titular.

**Why this priority**: Paridad operativa crítica: si el instructor falta, el Escolástico debe poder cubrir el registro sin bloqueos. Es también una necesidad de control institucional.

**Independent Test**: Iniciar sesión como Escolástico, navegar al pase de lista de una clase asignada a otro instructor, crear la sesión del día y registrar asistencias. Verificar que la sesión queda guardada y el log de auditoría muestra al Escolástico como actor.

**Acceptance Scenarios**:

1. **Given** un Escolástico autenticado, **When** accede al pase de lista de cualquier clase activa, **Then** el sistema muestra la misma interfaz completa de creación de sesión y marcado de asistencias que ve el instructor titular.
2. **Given** el Escolástico crea una sesión y registra asistencias, **When** el guardado se completa, **Then** el sistema registra en auditoría el ID del Escolástico como actor (no el del instructor asignado a la clase).
3. **Given** una sesión ya tiene asistencias registradas por el instructor, **When** el Escolástico abre esa sesión, **Then** el sistema muestra los estados previos permitiendo completar o corregir registros.

---

### User Story 2 - Attendance History Review (Priority: P2)

Como **instructor o escolastico**, quiero consultar el historial de asistencias de una materia específica para realizar un seguimiento del compromiso de los alumnos.

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

### User Story 4 - Gestión de sesiones por clase (Priority: P2)

Como **escolástico o instructor**, quiero acceder rápidamente a la gestión de sesiones de una clase seleccionada, ver el historial de sesiones anteriores y abrir una nueva, para administrar el registro de asistencia de forma centralizada sin salir del contexto de la clase.

**Why this priority**: Consolida en un solo flujo la creación, consulta y edición de sesiones, reduciendo la fricción operativa diaria.

**Independent Test**: Seleccionar una clase activa → navegar a su gestión de sesiones → ver lista de sesiones pasadas con fecha y día → abrir una sesión pasada → editar asistencia y metadatos → guardar. Verificar que los cambios persisten.

**Acceptance Scenarios**:

1. **Given** un instructor o escolástico en la lista de clases vigentes (`/admin/asistencia`), **When** selecciona una clase, **Then** el sistema navega a la gestión de sesiones de esa clase mostrando: el nombre de la clase y materia en el header, el historial cronológico de sesiones (fecha completa, nombre del día, tipo, N° de asistentes) y un botón prominente para crear/abrir la sesión del día.
2. **Given** el usuario abre una sesión del historial, **When** selecciona una sesión pasada, **Then** el sistema muestra el pase de lista con los estados de asistencia guardados para esa sesión; el header indica la fecha y día de la sesión (ej. "Miércoles 22 de Abril de 2026"), y se puede editar el estado de cada alumno y los metadatos de la sesión (tipo, tema, comentarios).
3. **Given** el usuario toca "Iniciar sesión de hoy" o equivalente, **When** se crea la sesión, **Then** el sistema muestra el pase de lista con el header indicando la fecha y día actual (ej. "Jueves 24 de Abril de 2026") y la sesión queda visible en el historial al retroceder.

---

### Edge Cases

- **Clase en día no programado**: El sistema permite tomar asistencia en cualquier fecha para contemplar recuperaciones de clase.
- **Cambio de estado posterior**: El instructor o escolástico puede corregir asistencias pasadas; el sistema registrará quién realizó el cambio para auditoría.
- **Sin conexión a internet**: El sistema requiere una conexión activa a internet para registrar la asistencia (Operación Online Only). Si no hay conexión, el usuario recibirá un aviso de error al intentar guardar.
- **Doble registro simultáneo**: Si el instructor y el Escolástico intentan registrar asistencia al mismo tiempo para la misma sesión, el sistema aplica el último guardado como estado vigente y deja ambas acciones en auditoría.
- **Clase Finalizada**: Ni el instructor ni el Escolástico pueden crear nuevas sesiones para clases con estado `Finalizada`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST ofrecer una interfaz optimizada para móviles (Mobile-First) para el registro de asistencias.
- **FR-002**: El sistema MUST permitir marcar estados de: `'Presente'`, `'Ausente'`, `'Licencia'` (Enum definido en spec 002, tabla `asistencias`).
- **FR-003**: El sistema MUST permitir el registro de asistencia por fecha (por defecto la actual).
- **FR-004**: El sistema MUST permitir el marcado masivo (ej. "Marcar todos como presentes") para agilizar el proceso.
- **FR-005**: El sistema MUST vincular cada registro de asistencia a una Inscripción (Usuario-Materia) y a una fecha específica.
- **FR-006**: El sistema MUST permitir a los administradores e instructores editar registros de asistencia existentes.
- **FR-007**: El sistema MUST calcular automáticamente el porcentaje de asistencia por alumno y materia.
- **FR-008**: La opción **"Pase de lista"** MUST estar visible en la barra de navegación lateral para usuarios con rol **Instructor** o **Escolástico**, dando acceso directo al pase de lista del día.
- **FR-009**: La opción **"Historial de asistencias"** MUST estar visible en la barra de navegación lateral para usuarios con rol **Escolástico** o **Instructor**, con acceso a la vista de resumen de asistencias.
- **FR-010**: La opción **"Kardex"** MUST estar visible en la barra de navegación lateral para todos los usuarios autenticados, dando acceso a su propio resumen de asistencias.
- **FR-011**: El sistema MUST permitir al rol **Escolástico** crear sesiones del día para cualquier clase activa del sistema, con los mismos permisos que el instructor titular de esa clase.
- **FR-012**: El sistema MUST mostrar al Escolástico la misma interfaz de pase de lista (creación de sesión, marcado masivo, marcado individual, edición de estados) que se muestra al instructor.
- **FR-013**: El sistema MUST registrar en los logs de auditoría el ID del Escolástico como actor cuando este crea sesiones o modifica asistencias.
- **FR-014**: La vista de **"Pase de lista"** del Escolástico MUST listar todas las clases activas del sistema (no solo las propias), con acceso completo a cada una.
- **FR-015**: El header del pase de lista MUST mostrar la fecha completa y el nombre del día de la semana de la sesión activa (ej. "Lunes 24 de Abril de 2026"), sin requerir un paso de confirmación previo a la creación.
- **FR-016**: Al seleccionar una clase desde la lista de clases vigentes (`/admin/asistencia`), el sistema MUST presentar una pantalla de gestión de sesiones para esa clase que incluya: (a) historial cronológico de sesiones (fecha completa, día de la semana, tipo, conteo de asistentes), (b) botón para crear/abrir sesión del día, (c) acceso a cualquier sesión pasada para editar asistencias individualmente y modificar tipo, tema y comentarios.

### Key Entities *(include if feature involves data)*

- **Asistencia**: Fecha, estado (Presente/Ausente/Licencia), observación opcional.
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
