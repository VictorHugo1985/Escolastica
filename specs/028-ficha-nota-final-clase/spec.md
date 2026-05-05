# Feature Specification: Ficha de Inscripción — Nota Final y Cierre de Clase

**Feature Branch**: `028-ficha-nota-final-clase`  
**Created**: 2026-05-04  
**Status**: Draft  
**Input**: User description: "Incluir en la ficha de inscripcion de un miembro inscrito en una clase vigente, el campo donde registra su nota final y si concluyo el temario, ademas de permitir concluir la vigencia de la clase, cambiandole el estado a Terminada."

## Clarifications

<!--
  This section records decisions made during /speckit.clarify sessions.
  Do not edit manually unless correcting typos.
-->

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar nota final del miembro inscrito (Priority: P1)

Un Escolástico o Instructor accede a la ficha de inscripción de un miembro dentro de una clase activa y registra la nota final obtenida por el miembro en esa clase, así como si concluyó o no el temario de la materia.

**Why this priority**: Es la acción central solicitada. Sin este campo, no hay registro oficial del resultado académico del miembro al finalizar la clase.

**Independent Test**: Abrir la ficha de inscripción de cualquier miembro en una clase con estado `Activa`, editar el campo de nota final y el indicador de temario concluido, guardar, y verificar que los valores persisten al recargar la ficha.

**Acceptance Scenarios**:

1. **Given** una clase en estado `Activa` con al menos un miembro inscrito, **When** el usuario accede a la ficha de inscripción del miembro y selecciona una nota final (ej. `Aprobado`) y marca "concluyó el temario", **Then** el sistema guarda ambos valores y los muestra correctamente en la ficha.

2. **Given** la ficha de inscripción de un miembro, **When** el usuario guarda sin seleccionar nota final, **Then** el campo queda vacío/nulo y no se impide el guardado (la nota final es opcional hasta el cierre formal de la clase).

3. **Given** una nota final ya registrada, **When** el usuario edita la nota y guarda de nuevo, **Then** el valor anterior se reemplaza con el nuevo valor.

---

### User Story 2 - Concluir la vigencia de una clase (Priority: P1)

Un Escolástico accede a la ficha o gestión de una clase activa y la cierra formalmente cambiando su estado a `Finalizada`.

**Why this priority**: Necesario para reflejar que una clase ha terminado su ciclo académico. Impacta reportes, disponibilidad de la clase en listas activas y flujo posterior de los miembros.

**Independent Test**: Desde la vista de detalle o gestión de una clase con estado `Activa`, ejecutar la acción "Finalizar clase" y verificar que el estado cambia a `Finalizada` y la acción ya no vuelve a estar disponible.

**Acceptance Scenarios**:

1. **Given** una clase con estado `Activa`, **When** el usuario ejecuta la acción "Finalizar clase", **Then** el estado de la clase cambia a `Finalizada` y la clase deja de aparecer en listas de clases vigentes.

2. **Given** una clase ya en estado `Finalizada`, **When** el usuario intenta finalizar de nuevo, **Then** la acción no está disponible (botón oculto o deshabilitado).

3. **Given** una clase en estado `Inactiva`, **When** el usuario intenta finalizarla, **Then** la acción no está disponible.

---

### Edge Cases

- ¿Qué sucede si se intenta editar la nota final en la inscripción de una clase ya `Finalizada`? → Se permite la edición para correcciones post-cierre con los mismos permisos de administrador.
- ¿Qué pasa si no todos los miembros tienen nota final al momento de finalizar la clase? → El cierre de la clase no está condicionado a que todas las inscripciones tengan nota final registrada.
- ¿El cambio de estado de la clase actualiza automáticamente el estado de las inscripciones activas? → No de forma automática; las inscripciones mantienen su estado individual.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar en la ficha de inscripción de un miembro un campo para registrar la **nota final** de la clase, seleccionable entre los valores: `Sobresaliente`, `Sólido`, `Aprobado`, `Reprobado`.
- **FR-002**: El sistema DEBE mostrar en la ficha de inscripción un campo editable que indique si el miembro **concluyó el temario** de la materia (sí/no), junto con la fecha de conclusión del temario cuando aplique.
- **FR-003**: El sistema DEBE permitir guardar los campos de nota final y conclusión de temario desde la ficha de inscripción.
- **FR-004**: El sistema DEBE mostrar en la vista de gestión de una clase un control que permita **finalizar la clase**, cambiando su estado de `Activa` a `Finalizada`.
- **FR-005**: La acción de finalizar una clase DEBE estar disponible únicamente cuando el estado actual de la clase es `Activa`.
- **FR-006**: Tras finalizar una clase, el sistema DEBE reflejar el nuevo estado `Finalizada` en todos los lugares donde se muestra el estado de la clase (listado de clases, detalle de clase, fichas de inscripción asociadas).
- **FR-007**: El sistema DEBE requerir confirmación del usuario antes de ejecutar el cambio de estado a `Finalizada`.
- **FR-008**: Los campos de nota final y conclusión de temario DEBEN ser editables por usuarios con rol `Escolastico` o `Instructor`.
- **FR-009**: Solo usuarios con rol `Escolastico` DEBEN poder ejecutar la acción de finalizar una clase.

### Key Entities *(include if feature involves data)*

<!--
  IMPORTANT: New entities or fields MUST be cross-referenced with Spec 003.
  If this feature adds a table, it should be marked for inclusion in Spec 003.
-->

- **`inscripciones`**: Entidad existente. Se agrega el campo `nota_final` (enumerado: Sobresaliente, Sólido, Aprobado, Reprobado, nullable). Los campos `concluyo_temario_materia` (Boolean) y `fecha_conclusion_temario` (Date, nullable) ya existen en el modelo de datos pero aún no están expuestos en la UI de la ficha de inscripción.

- **`clases`**: Entidad existente. El valor `Finalizada` ya existe en el enum `EstadoClase`. Se incorpora la acción en la interfaz para transicionar una clase de `Activa` a `Finalizada`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario autorizado puede registrar o actualizar la nota final de un miembro inscrito en menos de 30 segundos desde que accede a la ficha de inscripción.
- **SC-002**: El 100% de las inscripciones de una clase pueden tener su nota final y estado de temario registrados antes o después de que la clase sea finalizada, sin pérdida de datos.
- **SC-003**: El cambio de estado de una clase a `Finalizada` se refleja de forma inmediata en todos los listados y fichas relacionadas.
- **SC-004**: La acción "Finalizar clase" no es accesible en ninguna clase que esté en estado `Finalizada` o `Inactiva`.
- **SC-005**: Ningún dato existente de inscripciones o notas se pierde o altera como consecuencia directa de finalizar una clase.

## Assumptions

- La nota final es un campo diferente a las notas individuales del modelo `notas` (que registran evaluaciones parciales por tipo). La nota final resume el resultado global del miembro en la clase y se almacena directamente en `inscripciones`.
- Solo usuarios con rol `Escolastico` pueden ejecutar el cierre de una clase. Los `Instructor` pueden editar notas finales e indicadores de temario pero no finalizar clases.
- La fecha de conclusión del temario (`fecha_conclusion_temario`) se registra automáticamente con la fecha actual cuando el usuario marca que el miembro concluyó el temario y no había fecha previa.
- El estado de las inscripciones individuales no cambia automáticamente al finalizar la clase; ese flujo se gestiona por separado si se requiere.
