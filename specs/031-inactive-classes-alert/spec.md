# Feature Specification: Notificación de Clases sin Sesiones Recientes

**Feature Branch**: `031-inactive-classes-alert`
**Created**: 2026-07-10
**Status**: Draft
**Input**: User description: "Se requiere una notificacion nueva, en la que se listen las clases vigentes que no han registrado sesiones hace 15 dias o mas"

## Clarifications

<!--
  This section records decisions made during /speckit.clarify sessions.
  Do not edit manually unless correcting typos.
-->

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Alerta de clases inactivas en el panel de notificaciones (Priority: P1)

Como Escolástico o Instructor, al abrir el panel de notificaciones quiero ver una alerta que liste las clases vigentes que llevan 15 días o más sin registrar sesiones, para detectar clases desatendidas y tomar acción (contactar al instructor, verificar la agenda o dar de baja la clase).

**Why this priority**: Es el objetivo central de la funcionalidad. Sin esta alerta, las clases que dejan de operar pasan desapercibidas y los registros de asistencia y avance de temario quedan incompletos sin que nadie lo note.

**Independent Test**: Con una clase vigente cuya última sesión registrada tenga 15 días o más de antigüedad, verificar que el panel de notificaciones muestre una alerta que la incluya por nombre. Con todas las clases al día, verificar que la alerta no aparece.

**Acceptance Scenarios**:

1. **Dado** que existe al menos una clase vigente cuya última sesión registrada fue hace 15 días o más, **Cuando** el usuario abre el panel de notificaciones, **Entonces** ve una notificación que lista esa(s) clase(s) identificándolas por materia y código.
2. **Dado** que todas las clases vigentes registraron alguna sesión en los últimos 14 días, **Cuando** el usuario abre el panel de notificaciones, **Entonces** no aparece ninguna notificación de clases inactivas.
3. **Dado** que una clase listada en la alerta registra una nueva sesión, **Cuando** el sistema vuelve a evaluar las clases inactivas, **Entonces** esa clase deja de aparecer en la notificación.
4. **Dado** que la notificación de clases inactivas ya existe y la lista de clases afectadas cambia, **Cuando** el sistema vuelve a evaluar, **Entonces** la notificación existente se actualiza (contenido y marca de tiempo) en lugar de crearse una notificación adicional.

---

### User Story 2 - Consulta en el historial de actividad (Priority: P2)

Como Escolástico, quiero que la alerta de clases inactivas también sea consultable en la página de historial de actividad y filtrable por su tipo, para revisar cuándo se detectaron clases desatendidas en el pasado.

**Why this priority**: Complementa la alerta principal con trazabilidad, pero la detección oportuna (User Story 1) aporta la mayor parte del valor.

**Independent Test**: En la página de historial, seleccionar el filtro del nuevo tipo de notificación y verificar que solo se muestren alertas de clases inactivas.

**Acceptance Scenarios**:

1. **Dado** que existe al menos una notificación de clases inactivas, **Cuando** el usuario filtra el historial por ese tipo, **Entonces** solo se muestran notificaciones de clases inactivas.

---

### Edge Cases

- Una clase vigente que nunca ha registrado sesiones: se considera inactiva cuando han pasado 15 días o más desde su fecha de inicio (o de creación, si no tiene fecha de inicio definida).
- Una clase dada de baja o concluida (no vigente) no debe aparecer en la alerta, aunque su última sesión sea antigua.
- Si una clase deja de estar inactiva (registra sesión) y luego vuelve a acumular 15 días sin sesiones, debe volver a aparecer en la alerta.
- Si ninguna clase está inactiva, no se genera ni se mantiene una notificación vacía.
- Períodos de receso (vacaciones): el sistema no distingue recesos; las clases aparecerán en la alerta. Se acepta como comportamiento esperado en esta iteración.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE identificar como "clase inactiva" toda clase vigente cuya sesión registrada más reciente tenga una antigüedad de 15 días o más respecto a la fecha actual.
- **FR-002**: El sistema DEBE incluir también como "clase inactiva" las clases vigentes que nunca han registrado sesiones y cuyo inicio (o creación) ocurrió hace 15 días o más.
- **FR-003**: El sistema DEBE generar automáticamente una notificación que liste todas las clases inactivas detectadas, identificando cada una al menos por materia y código, y visible en el panel de notificaciones y en el historial de actividad existentes.
- **FR-004**: La evaluación de clases inactivas DEBE ejecutarse automáticamente al menos una vez por día, sin intervención manual.
- **FR-005**: Mientras exista una notificación de clases inactivas vigente para el mismo día, el sistema DEBE actualizarla (lista de clases y marca de tiempo) en lugar de crear notificaciones duplicadas.
- **FR-006**: Cuando ninguna clase esté inactiva, el sistema NO DEBE generar una nueva notificación; las notificaciones históricas se conservan en el historial.
- **FR-007**: La notificación de clases inactivas DEBE ser visible para los mismos roles que el resto de las notificaciones de actividad (Escolástico e Instructor), mostrando a ambos el mismo contenido.
- **FR-008**: El historial de actividad DEBE permitir filtrar por el nuevo tipo de notificación.
- **FR-009**: La notificación DEBE indicar, para cada clase listada, cuántos días han pasado desde su última sesión registrada (o desde su inicio, si nunca registró sesiones).

### Key Entities *(include if feature involves data)*

<!--
  IMPORTANT: New entities or fields MUST be cross-referenced with Spec 003.
  If this feature adds a table, it should be marked for inclusion in Spec 003.
-->

- **Notificación de Actividad** (existente, Spec 030): se amplía su catálogo de tipos de acción con un nuevo valor: "clases sin sesiones recientes". No requiere atributos nuevos; la descripción legible contiene la lista de clases afectadas y los días de inactividad de cada una.
- **Clase** (existente, Spec 003): no se modifica; se consulta su vigencia y la fecha de su sesión registrada más reciente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las clases vigentes con 15 días o más sin sesiones registradas aparecen listadas en la notificación en un plazo máximo de 24 horas desde que cruzan el umbral.
- **SC-002**: Ninguna clase no vigente ni clase con sesiones registradas en los últimos 14 días aparece en la alerta (0 falsos positivos en la evaluación diaria).
- **SC-003**: En cualquier momento existe como máximo una notificación de clases inactivas por día en el panel, independientemente de cuántas veces se ejecute la evaluación.
- **SC-004**: El usuario puede identificar la clase (materia y código) y los días de inactividad de cada elemento listado sin navegar a otra pantalla.

## Assumptions

- "Clases vigentes" se interpreta como las clases en estado activo; las clases concluidas o dadas de baja quedan fuera del alcance.
- "Registrar una sesión" se interpreta como la existencia de una sesión con pase de lista para la clase; la fecha de referencia es la fecha de la sesión registrada más reciente.
- La alerta se integra al sistema de notificaciones de actividad existente (Spec 030) como un nuevo tipo de notificación, reutilizando el panel de cabecera, el contador de no leídas y la página de historial.
- La evaluación es automática y diaria; no se requiere un botón de verificación manual en esta iteración.
- Se genera una única notificación que lista todas las clases inactivas (no una notificación por clase), según lo solicitado en la descripción.
- El umbral de 15 días es fijo en esta iteración; su configuración como parámetro puede evaluarse a futuro.
- No se contempla el envío de correos u otros canales externos; la alerta vive únicamente dentro de la aplicación.
