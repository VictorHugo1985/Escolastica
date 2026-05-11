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

### User Story 1 - Registrar múltiples notas finales del miembro inscrito (Priority: P1)

Un Escolástico o Instructor accede a la ficha de inscripción de un miembro dentro de una clase activa y registra una o más notas finales obtenidas por el miembro, seleccionando para cada una el tipo de nota desde una lista predefinida de opciones y el valor de la calificación.

**Why this priority**: Es la acción central solicitada. La posibilidad de registrar varios tipos de nota final (por ejemplo, una nota teórica y una práctica) refleja con precisión el resultado académico completo del miembro al finalizar la clase.

**Independent Test**: Abrir la ficha de inscripción de cualquier miembro en una clase con estado `Activa`, agregar dos notas finales de distintos tipos, guardar, y verificar que ambas persisten al recargar la ficha. Eliminar una de ellas y verificar que solo queda la otra.

**Acceptance Scenarios**:

1. **Given** una clase en estado `Activa` con al menos un miembro inscrito, **When** el usuario accede a la ficha de inscripción del miembro y agrega una nota final seleccionando el tipo (ej. `Nota Teórica`) y el valor (ej. `Aprobado`), **Then** el sistema guarda la nota y la muestra en la lista de notas finales de la ficha.

2. **Given** la ficha de inscripción de un miembro con una nota final ya registrada, **When** el usuario agrega una segunda nota de tipo diferente (ej. `Nota Práctica` — `Sobresaliente`), **Then** el sistema guarda ambas notas y las muestra listadas en la ficha.

3. **Given** la ficha de inscripción de un miembro, **When** el usuario guarda sin agregar ninguna nota final, **Then** la sección queda vacía y no se impide el guardado (las notas finales son opcionales hasta el cierre formal de la clase).

4. **Given** una nota final ya registrada, **When** el usuario la elimina y confirma la acción, **Then** la nota desaparece de la lista y el cambio persiste al recargar.

5. **Given** que ya existe una nota del mismo tipo para esa inscripción, **When** el usuario intenta agregar otra nota con el mismo tipo, **Then** el sistema impide el duplicado y muestra un mensaje indicando que ya existe una nota de ese tipo.

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

- ¿Qué sucede si se intenta agregar o eliminar una nota final en la inscripción de una clase ya `Finalizada`? → Se permite para correcciones post-cierre con los mismos permisos de administrador.
- ¿Qué pasa si no todos los miembros tienen notas finales al momento de finalizar la clase? → El cierre de la clase no está condicionado a que todas las inscripciones tengan notas finales registradas.
- ¿El cambio de estado de la clase actualiza automáticamente el estado de las inscripciones activas? → No de forma automática; las inscripciones mantienen su estado individual.
- ¿Puede un miembro tener dos notas del mismo tipo para la misma inscripción? → No; el sistema debe impedir duplicados de tipo por inscripción.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar en la ficha de inscripción de un miembro una sección de **notas finales** que liste todas las notas finales registradas para esa inscripción.
- **FR-002**: El sistema DEBE permitir **agregar múltiples notas finales** a una inscripción. Cada nota final debe contener: un **tipo de nota** seleccionado desde una lista predefinida de opciones, y un **valor de calificación** seleccionado entre: `Sobresaliente`, `Sólido`, `Aprobado`, `Reprobado`.
- **FR-003**: El sistema DEBE ofrecer la siguiente lista de **tipos de nota** predefinidos al momento de registrar una nota final: `Nota Teórica`, `Nota Práctica`, `Examen Final`, `Trabajo Escrito`.
- **FR-004**: El sistema DEBE impedir registrar dos notas finales del mismo tipo para la misma inscripción, mostrando un mensaje de error si se intenta.
- **FR-005**: El sistema DEBE permitir **eliminar** una nota final individual de la lista, con confirmación previa del usuario.
- **FR-006**: El sistema DEBE mostrar en la ficha de inscripción un campo editable que indique si el miembro **concluyó el temario** de la materia (sí/no), junto con la fecha de conclusión del temario cuando aplique.
- **FR-007**: El sistema DEBE mostrar en la vista de gestión de una clase un control que permita **finalizar la clase**, cambiando su estado de `Activa` a `Finalizada`.
- **FR-008**: La acción de finalizar una clase DEBE estar disponible únicamente cuando el estado actual de la clase es `Activa`.
- **FR-009**: Tras finalizar una clase, el sistema DEBE reflejar el nuevo estado `Finalizada` en todos los lugares donde se muestra el estado de la clase (listado de clases, detalle de clase, fichas de inscripción asociadas).
- **FR-010**: El sistema DEBE requerir confirmación del usuario antes de ejecutar el cambio de estado a `Finalizada`.
- **FR-011**: Las notas finales y el campo de conclusión de temario DEBEN ser editables por usuarios con rol `Escolastico` o `Instructor`.
- **FR-012**: Solo usuarios con rol `Escolastico` DEBEN poder ejecutar la acción de finalizar una clase.

### Key Entities *(include if feature involves data)*

<!--
  IMPORTANT: New entities or fields MUST be cross-referenced with Spec 003.
  If this feature adds a table, it should be marked for inclusion in Spec 003.
-->

- **`inscripciones`**: Entidad existente. Ya no almacena `nota_final` como campo único. Los campos `concluyo_temario_materia` (Boolean) y `fecha_conclusion_temario` (Date, nullable) ya existen en el modelo de datos pero aún no están expuestos en la UI de la ficha de inscripción.

- **`notas_finales_inscripcion`** *(nueva entidad)*: Registra cada nota final de una inscripción. Atributos: `id`, `inscripcion_id` (FK → inscripciones), `tipo_nota` (enumerado: ver FR-003), `valor` (enumerado: Sobresaliente, Sólido, Aprobado, Reprobado). Restricción de unicidad: (`inscripcion_id`, `tipo_nota`). Debe referenciarse en Spec 003.

- **`clases`**: Entidad existente. El valor `Finalizada` ya existe en el enum `EstadoClase`. Se incorpora la acción en la interfaz para transicionar una clase de `Activa` a `Finalizada`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario autorizado puede agregar una nueva nota final a una inscripción en menos de 30 segundos desde que accede a la ficha.
- **SC-002**: Una inscripción puede tener registradas tantas notas finales como tipos de nota existan en la lista, sin restricción de cantidad más allá de la unicidad por tipo.
- **SC-003**: El 100% de las inscripciones de una clase pueden tener sus notas finales y estado de temario registrados antes o después de que la clase sea finalizada, sin pérdida de datos.
- **SC-004**: El cambio de estado de una clase a `Finalizada` se refleja de forma inmediata en todos los listados y fichas relacionadas.
- **SC-005**: La acción "Finalizar clase" no es accesible en ninguna clase que esté en estado `Finalizada` o `Inactiva`.
- **SC-006**: Ningún dato existente de inscripciones o notas se pierde o altera como consecuencia directa de finalizar una clase.

## Assumptions

- Las notas finales son una colección separada por inscripción, no un campo único. Cada nota tiene un tipo y un valor. Esto reemplaza el enfoque anterior de un campo `nota_final` único en `inscripciones`.
- Los tipos de nota son un conjunto predefinido (no configurable por el usuario desde la UI en esta versión). La lista exacta requiere confirmación (ver FR-003).
- Solo usuarios con rol `Escolastico` pueden ejecutar el cierre de una clase. Los `Instructor` pueden agregar, eliminar y consultar notas finales e indicadores de temario pero no finalizar clases.
- La fecha de conclusión del temario (`fecha_conclusion_temario`) se registra automáticamente con la fecha actual cuando el usuario marca que el miembro concluyó el temario y no había fecha previa.
- El estado de las inscripciones individuales no cambia automáticamente al finalizar la clase; ese flujo se gestiona por separado si se requiere.
