# Feature Specification: Horario Fijo Obligatorio por Clase

**Feature Branch**: `025-horario-fijo-clases`  
**Created**: 2026-04-25  
**Status**: Draft  
**Input**: User description: "Todas las clases requieren que se registre un horario fijo para sus sesiones (ejemplo los jueves de 8pm a 10pm), que ese horario y dia sea consultado como referencia en los filtros (el dia de la clase) al momento de tomar lista sea tomado como referencia en la creacion de una sesion"

## Clarifications

<!--
  This section records decisions made during /speckit.clarify sessions.
  Do not edit manually unless correcting typos.
-->

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Horario obligatorio al crear o editar una clase (Priority: P1)

Cuando un administrador crea una clase nueva o edita una existente, el sistema debe exigir que se defina al menos un horario fijo: el día de la semana y el rango horario de inicio y fin de cada sesión. Sin este dato, no se puede guardar la clase. Esto garantiza que cada clase tenga información de cuándo se dicta, que luego es usada en otras funcionalidades del sistema.

**Why this priority**: Es el dato base que habilita el filtrado por día en el listado de asistencia y la creación automática de sesiones con fecha correcta. Sin horario, las demás funcionalidades derivadas no pueden operar.

**Independent Test**: Intentar crear una clase sin asignar ningún horario debe resultar en un mensaje de error que impide guardar. Una clase guardada exitosamente debe mostrar su horario en el listado de clases.

**Acceptance Scenarios**:

1. **Given** un administrador abre el formulario de nueva clase, **When** intenta guardar sin definir ningún horario, **Then** el sistema muestra un mensaje de error indicando que el horario es obligatorio y no guarda la clase.

2. **Given** un administrador completa todos los campos de una clase incluyendo al menos un horario (día + hora inicio + hora fin), **When** guarda la clase, **Then** la clase queda registrada con el horario visible en el sistema.

3. **Given** una clase con horario definido, **When** se visualiza en el listado de clases, **Then** el día y rango horario aparece como referencia en la tarjeta o fila correspondiente.

---

### User Story 2 - Filtrar clases por día de la semana en el listado de asistencia (Priority: P2)

Cuando un instructor o administrador accede al listado de clases para tomar lista, puede filtrar las clases mostradas según el día de la semana en que se dictan. Esto permite focalizarse rápidamente en las clases del día actual u otro día específico, especialmente útil para administradores que gestionan múltiples clases con distintos horarios.

**Why this priority**: Mejora la usabilidad del listado de asistencia cuando hay muchas clases activas. El día de la semana ya existe como dato del horario y filtrarlo es de bajo costo pero alto valor práctico.

**Independent Test**: En el listado de asistencia con clases de distintos días, aplicar el filtro "Lunes" debe mostrar solo clases cuyo horario incluye el lunes y ocultar las demás.

**Acceptance Scenarios**:

1. **Given** el listado de asistencia muestra clases de distintos días, **When** el usuario selecciona un filtro de día (ej: "Jueves"), **Then** solo se muestran las clases que tienen al menos un horario programado para ese día de la semana.

2. **Given** el filtro de día está activo, **When** el usuario lo limpia o selecciona "Todos", **Then** se muestran todas las clases activas nuevamente.

3. **Given** el usuario es instructor, **When** accede al listado de asistencia, **Then** el filtro por día está preseleccionado con el día actual, mostrando solo sus clases de hoy por defecto.

4. **Given** el usuario es administrador/escolástico, **When** accede al listado de asistencia, **Then** el filtro por día está disponible junto al filtro por instructor existente, sin preselección automática.

---

### User Story 3 - Fecha de sesión derivada del horario al iniciar pase de lista (Priority: P3)

Cuando un instructor o administrador inicia una nueva sesión de pase de lista para una clase, el sistema propone automáticamente como fecha de la sesión el día de la semana programado en el horario de la clase, correspondiente a la semana actual. El usuario puede modificar esa fecha en la edición de la sesión.

**Why this priority**: Evita errores de fecha al crear sesiones y reduce pasos manuales. Complementa los user stories anteriores cerrando el ciclo: el horario registrado determina cuándo ocurren las sesiones.

**Independent Test**: Crear una nueva sesión para una clase programada los jueves debe registrar la sesión con la fecha del jueves de la semana en curso, sin que el usuario la ingrese manualmente.

**Acceptance Scenarios**:

1. **Given** una clase con horario programado para los jueves, **When** se inicia una nueva sesión cualquier día de esa semana, **Then** la sesión queda registrada con la fecha del jueves de esa semana.

2. **Given** una sesión recién creada con fecha pre-cargada, **When** el usuario accede a la edición de esa sesión, **Then** puede cambiar la fecha a cualquier otro valor válido.

3. **Given** una clase sin horario registrado (caso borde), **When** se inicia una sesión, **Then** el sistema usa la fecha actual como alternativa sin bloquear la operación.

---

### Edge Cases

- Si una clase tiene múltiples horarios (ej: lunes y jueves), el sistema usa el primer horario registrado como referencia para la fecha de sesión; todos los días siguen siendo válidos como filtro en el listado de asistencia.
- Si el día programado ya pasó en la semana actual, el sistema igual pre-carga esa fecha (puede quedar en el pasado); el usuario puede ajustarla desde la edición de la sesión.
- Si el instructor filtra por día y no tiene clases ese día, se muestra un estado vacío informativo.
- Si se intenta agregar un segundo horario para el mismo día de la semana en la misma clase, el sistema lo permite o lo rechaza según la regla de unicidad (ver Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Al crear una clase nueva, el sistema DEBE requerir la definición de al menos un horario fijo (día de la semana + hora de inicio + hora de fin) antes de permitir guardar.
- **FR-002**: El horario de una clase DEBE especificar: el día de la semana (lunes a sábado), la hora de inicio y la hora de fin de la sesión.
- **FR-003**: El listado de clases DEBE mostrar el horario de cada clase (día y rango horario) como dato de referencia visible.
- **FR-004**: El listado de asistencia DEBE ofrecer un filtro por día de la semana que muestre solo las clases cuyo horario incluye ese día.
- **FR-005**: Para instructores, el filtro por día en el listado de asistencia DEBE estar preseleccionado con el día actual al ingresar.
- **FR-006**: Para administradores/escolásticos, el filtro por día en el listado de asistencia DEBE estar disponible sin preselección automática.
- **FR-007**: Al iniciar una nueva sesión de pase de lista, el sistema DEBE pre-cargar como fecha de la sesión el día de la semana del horario de la clase dentro de la semana en curso.
- **FR-008**: La fecha de una sesión DEBE poder ser modificada por el usuario desde la edición de la sesión una vez creada.
- **FR-009**: Si una clase no tiene horario registrado, el sistema DEBE usar la fecha actual al crear la sesión sin bloquear la operación.

### Key Entities *(include if feature involves data)*

<!--
  IMPORTANT: New entities or fields MUST be cross-referenced with Spec 003.
  If this feature adds a table, it should be marked for inclusion in Spec 003.
-->

- **Horario**: Registro de día y rango horario asociado a una clase. Atributos: día de la semana (lunes=1 a sábado=6), hora de inicio, hora de fin, referencia a la clase. Una clase puede tener uno o más horarios. Actualmente existe en el sistema como campo opcional; esta especificación lo vuelve obligatorio para la creación de nuevas clases. Cross-reference: Spec 003.
- **Clase**: Entidad existente. Se añade la restricción de que debe tener al menos un horario para ser creada. Cross-reference: Spec 003.
- **Sesión**: Entidad existente. La fecha se deriva del horario de la clase al momento de la creación. Cross-reference: Spec 003.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las clases nuevas creadas en el sistema tienen al menos un horario registrado (día + hora inicio + hora fin).
- **SC-002**: Los usuarios pueden aplicar el filtro por día en el listado de asistencia y ver resultados en menos de 2 segundos.
- **SC-003**: El 100% de las sesiones creadas para clases con horario registrado tienen como fecha el día programado de la semana en curso, sin entrada manual del usuario.
- **SC-004**: Los instructores acceden al listado de asistencia con sus clases del día ya filtradas automáticamente, sin pasos adicionales.
- **SC-005**: La creación de una sesión de pase de lista no requiere más de 2 interacciones del usuario (tap en "Iniciar Sesión" + confirmación implícita).

## Assumptions

- Las clases existentes sin horario registrado no son afectadas retroactivamente; solo nuevas clases quedan sujetas a la obligatoriedad del horario.
- Se permite como máximo un horario por día de la semana por clase (no se registra la misma clase dos veces el mismo día).
- El rango horario (hora inicio/fin) es informativo en este alcance; no se validan conflictos de aulas por superposición horaria.
- Cuando una clase tiene múltiples horarios, el primero registrado es el que se usa como referencia para pre-cargar la fecha al crear una sesión.
- El filtro por día en el listado de asistencia opera sobre el horario registrado de la clase, no sobre el historial de fechas de sesiones pasadas.
- El horario de inicio y fin se registra en formato de 24 horas y se muestra al usuario en formato legible (ej: 20:00 → 22:00).
