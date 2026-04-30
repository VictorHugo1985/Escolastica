# Feature Specification: Ficha de Probacionista en Bandeja de Aprobación

**Feature Branch**: `017-probacionista-ficha`  
**Created**: 2026-04-22  
**Status**: Draft  
**Input**: User description: "crear una nueva spec llamada probacionista, que incluya la historia de usuario de la bandeja de aprobacion, en la que incluya en la ficha del probacionista quien fue su instructor de su materia de probacionismo (ultima materia) como referencia (si es que estuviera inscrito)"

## Clarifications

<!--
  This section records decisions made during /speckit.clarify sessions.
  Do not edit manually unless correcting typos.
-->

### Session 2026-04-23

- Q: ¿Puede un usuario con rol `Escolastico` ser asignado como instructor titular de una clase de probacionismo sin tener el rol de Instructor? → A: No. Según spec 003 FR-003 y SC-002, solo usuarios con `rol = 'Instructor'` son elegibles como docentes. Un Escolastico requiere asignación explícita del rol Instructor para impartir clases.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ficha de Probacionista con Instructor de Referencia (Priority: P1)

Como **escolástico**, quiero ver en la Bandeja de Aprobación la ficha completa de cada Probacionista, incluyendo —si estuvo inscrito en una materia de probacionismo— quién fue su instructor en esa materia, para tener contexto académico al momento de evaluar su promoción.

**Why this priority**: La decisión de promover a un Probacionista requiere contexto. Conocer quién fue su instructor en la materia de probacionismo permite al Escolástico consultar directamente al docente o ponderar mejor la evaluación antes de otorgar membresía.

**Independent Test**: Desde la Bandeja de Aprobación, seleccionar un Probacionista que haya estado inscrito en una materia de probacionismo y verificar que el nombre del instructor aparece en su ficha. Seleccionar un Probacionista sin inscripción y verificar que el campo de instructor muestra "Sin inscripción registrada".

**Acceptance Scenarios**:

1. **Given** la Bandeja de Aprobación con un Probacionista que estuvo inscrito en una materia de probacionismo, **When** el Escolástico visualiza su ficha, **Then** el sistema muestra el nombre completo del instructor titular de la clase más reciente de probacionismo a la que estuvo inscrito.
2. **Given** un Probacionista sin ninguna inscripción en materias de probacionismo, **When** el Escolástico visualiza su ficha, **Then** el campo instructor de referencia muestra "Sin inscripción registrada".
3. **Given** un Probacionista con múltiples inscripciones en materias de probacionismo, **When** el Escolástico visualiza su ficha, **Then** el sistema toma como referencia la inscripción más reciente (ordenada por fecha de inscripción descendente).
4. **Given** la ficha de cualquier Probacionista, **When** el Escolástico la visualiza, **Then** el instructor de referencia aparece como dato de solo lectura; no es editable.
5. **Given** un Probacionista cuyo instructor de referencia fue desactivado del sistema, **When** el Escolástico visualiza la ficha, **Then** el nombre del instructor se muestra igualmente (dato histórico, independiente del estado actual del instructor).

---

### User Story 2 - Bandeja de Aprobación Enriquecida (Priority: P1)

Como **escolástico**, quiero que la Bandeja de Aprobación muestre en una tarjeta compacta los datos esenciales de cada Probacionista —incluyendo contacto, estado de entrevista e instructor de referencia— sin navegar a otra pantalla, para agilizar la evaluación masiva.

**Why this priority**: Reducir la cantidad de pasos para evaluar múltiples Probacionistas acelera el flujo administrativo en períodos de alta demanda de admisiones.

**Independent Test**: Cargar la Bandeja de Aprobación con Probacionistas en distintos estados (con/sin entrevista, con/sin instructor de referencia) y verificar que toda la información relevante es visible en las tarjetas sin ninguna navegación adicional.

**Acceptance Scenarios**:

1. **Given** la Bandeja de Aprobación, **When** el Escolástico la abre, **Then** cada tarjeta muestra: nombre completo, CI (si existe), email (si existe), fecha de ingreso, estado de entrevista e instructor de referencia de probacionismo.
2. **Given** un Probacionista sin instructor de referencia, **When** se muestra su tarjeta, **Then** la sección de instructor presenta un indicador neutro informativo, no un mensaje de error.
3. **Given** la bandeja con múltiples Probacionistas, **When** el Escolástico la carga, **Then** los datos de instructor de referencia se recuperan en una única operación, sin solicitudes adicionales por tarjeta.

### User Story 3 - Seguimiento de Entrevista de Probacionistas (Priority: P1)

Como **escolástico**, quiero registrar la fecha en que se realizó la entrevista previa a la aprobación de un Probacionista y marcarla como completada, para llevar un control del proceso de admisión antes de proceder con la promoción. Habilitar filtros de busqueda 
por probacionista o su instructor. Incluir un nuevo Rol: Ex-probacionista el cual de esta bandeja de aprobacion es cambiado a ex-probacionista y permite registra un comentario en la tabla usuario. 

**Why this priority**: Permite al Escolástico auditar el estado de admisión de cada Probacionista y asegurarse de que el proceso de entrevista se completó antes de otorgar membresía.

**Independent Test**: Desde la Bandeja de Aprobación, seleccionar un Probacionista, ingresar una fecha de entrevista, marcar `entrevista_completada = true`, guardar y verificar que los datos persisten correctamente y solo son visibles desde esa bandeja.


---

### Edge Cases

- ¿Qué pasa si el instructor fue dado de baja (soft delete)? El nombre se muestra igualmente como dato histórico.
- ¿Qué pasa si la clase de probacionismo no tiene instructor registrado (dato incompleto)? La sección muestra "Instructor no registrado".
- ¿Qué pasa si el Probacionista estuvo inscrito en varias materias de probacionismo? Se toma la inscripción más reciente por fecha.
- ¿Qué pasa si el Probacionista fue dado de baja de la materia antes de completarla? La referencia se muestra igualmente; se indica el estado de la inscripción (Activo / Baja / Finalizado) como contexto adicional.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mostrar en la ficha de cada Probacionista el nombre completo del instructor titular de su inscripción más reciente en una materia de probacionismo, si existe.
- **FR-002**: El sistema MUST identificar las materias de probacionismo por el campo `es_curso_probacion = true` de la materia.
- **FR-003**: El sistema MUST seleccionar la inscripción de referencia como la más reciente en fecha entre todas las inscripciones del Probacionista en materias de probacionismo.
- **FR-004**: El sistema MUST mostrar el instructor de referencia como campo de solo lectura; no debe permitir edición desde la Bandeja de Aprobación.
- **FR-005**: El sistema MUST mostrar "Sin inscripción registrada" cuando el Probacionista no tenga inscripciones en materias de probacionismo.
- **FR-006**: El sistema MUST mostrar el nombre del instructor aunque su estado en el sistema sea "Inactivo".
- **FR-007**: El sistema MUST mostrar junto al nombre del instructor el estado de la inscripción de referencia (Activo / Baja / Finalizado) como dato de contexto.
- **FR-009**: El instructor de referencia en la ficha siempre corresponde a un usuario con `rol = 'Instructor'`, conforme a spec 003 FR-003. El campo se muestra como dato de solo lectura sin distinción visual adicional.
- **FR-008**: El sistema MUST recuperar los datos de instructor de referencia para todos los Probacionistas listados sin generar consultas individuales por tarjeta (carga eficiente).

### Key Entities *(include if feature involves data)*

- **Probacionista**: Usuario con `rol.nombre = 'Probacionista'`. Incluye `fecha_entrevista` y `entrevista_completada` (spec 003). Su instructor de referencia se deriva en tiempo de consulta desde sus inscripciones.
- **Inscripción de Probacionismo**: La inscripción más reciente del Probacionista en una clase cuya materia tiene `es_curso_probacion = true`. Campos relevantes: `estado` (Activo/Baja/Finalizado), `fecha_inscripcion`. (Entidad `inscripciones` de spec 007.)
- **Instructor de Referencia**: Dato derivado: `nombre_completo` del usuario asignado como `instructor` en la clase de probacionismo más reciente. No se almacena como campo nuevo; se resuelve en consulta. (Entidad `usuarios` de spec 003, `clases` de spec 004.)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los Probacionistas con inscripción en materia de probacionismo muestran el nombre de su instructor de referencia en la Bandeja de Aprobación.
- **SC-002**: El 100% de los Probacionistas sin inscripción en materias de probacionismo muestran "Sin inscripción registrada" sin errores visuales.
- **SC-003**: La Bandeja de Aprobación carga los datos de instructor de referencia de todos los Probacionistas en una única operación, sin acciones adicionales del usuario.
- **SC-004**: El nombre del instructor de referencia es visible en la tarjeta del Probacionista sin necesidad de navegar a otra pantalla.
- **SC-005**: El dato del instructor se mantiene visible aunque el instructor haya sido desactivado, en el 100% de los casos.

## Assumptions

- La determinación del "instructor de referencia" se basa en la última inscripción del Probacionista en una materia con `es_curso_probacion = true`, ordenada por `fecha_inscripcion` descendente.
- El instructor de referencia es un dato derivado en consulta; no se agrega un campo nuevo a la entidad `usuarios`.
- Si en el futuro se requiere persistir el instructor de referencia como campo permanente, será cubierto por una spec independiente.
- El instructor de referencia siempre es un usuario con `rol = 'Instructor'` (spec 003 FR-003). Un Escolastico solo puede ser instructor si se le asigna explícitamente ese rol.
- **Dependencias**: spec 003 (usuarios, bandeja de aprobación), spec 004 (clases, instructor_id), spec 007 (inscripciones).
