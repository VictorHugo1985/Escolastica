# Feature Specification: Cierre y Acceso Histórico de Clases

**Feature Branch**: `026-concluir-clase`
**Created**: 2026-04-25
**Status**: Draft
**Input**: User description: "Una clase puede pasar a estado concluida, manteniendo todos los datos asociados (estos pueden ser consultados desde las mismas interfaces aplicando el filtro de ver clases historicas), pudiendo igualmente editar algun dato (solo con el rol escolastico)"

## Clarifications

<!--
  This section records decisions made during /speckit.clarify sessions.
  Do not edit manually unless correcting typos.
-->

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Concluir una clase (Priority: P1)

Como **escolástico**, quiero marcar una clase como concluida para registrar formalmente su cierre, sabiendo que todos sus datos históricos (sesiones, asistencias, inscripciones) quedan preservados y accesibles.

**Why this priority**: Es la acción desencadenante de todo el flujo. Sin el cambio de estado, los demás escenarios no tienen sentido. Permite diferenciar clases activas de clases cerradas en todas las vistas.

**Independent Test**: Iniciar sesión como Escolástico, abrir el detalle de una clase activa, ejecutar la acción "Concluir clase" y verificar que el estado cambia a Concluida sin pérdida de datos asociados.

**Acceptance Scenarios**:

1. **Given** una clase en estado Activa, **When** el Escolástico ejecuta "Concluir clase", **Then** el estado cambia a Concluida y todos sus datos (sesiones, asistencias, inscripciones) permanecen íntegros y consultables.
2. **Given** una clase Concluida, **When** cualquier usuario intenta registrar una nueva sesión o inscripción, **Then** el sistema rechaza la operación con mensaje claro indicando que la clase está cerrada.
3. **Given** una clase Concluida, **When** el Escolástico actualiza un dato editable (comentarios, celador), **Then** el sistema permite la edición y persiste el cambio.
4. **Given** una clase Concluida, **When** un usuario con rol Instructor intenta editar datos de la clase, **Then** el sistema rechaza la operación.

---

### User Story 2 - Consultar clases históricas (Priority: P1)

Como **usuario del sistema** (Escolástico o Instructor), quiero filtrar las vistas existentes para incluir clases Concluidas, de modo que pueda consultar el historial sin cambiar de pantalla.

**Why this priority**: La utilidad del estado Concluida depende directamente de poder consultar esos datos. Sin este filtro, la información histórica queda inaccesible en la práctica.

**Independent Test**: En la vista de lista de clases (asistencia, gestión), activar el filtro "Ver historial" y verificar que aparecen las clases Concluidas con todos sus datos.

**Acceptance Scenarios**:

1. **Given** la vista de lista de clases, **When** el usuario activa el filtro "Ver historial", **Then** las clases Concluidas aparecen junto a las activas, claramente diferenciadas con una etiqueta de estado.
2. **Given** una clase Concluida en el listado, **When** el usuario accede a su detalle, **Then** puede navegar todas sus sesiones, asistencias e inscripciones históricas normalmente.
3. **Given** la vista de pase de lista, **When** el filtro histórico está activo, **Then** las clases Concluidas aparecen pero sin opción de iniciar nuevas sesiones.

---

### Edge Cases

- **Reversibilidad**: El estado Concluida es definitivo; no existe acción de "reabrir" clase (fuera de alcance).
- **Clase sin sesiones**: Una clase puede concluirse aunque no tenga sesiones registradas.
- **Inscripciones activas al cierre**: Al concluir, las inscripciones quedan en su estado actual sin modificación automática.
- **Instructor sin clases activas**: Si todas sus clases están Concluidas, ve la lista vacía por defecto y debe activar el filtro histórico.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir al Escolástico cambiar el estado de una clase de Activa a Concluida desde el detalle de la clase, con confirmación explícita antes de ejecutar el cambio.
- **FR-002**: Al concluir una clase, el sistema MUST preservar íntegramente todos los datos asociados: sesiones, asistencias, inscripciones, horarios y comentarios.
- **FR-003**: Las vistas de listado de clases (gestión y asistencia) MUST ofrecer un filtro para incluir clases Concluidas ("Ver historial"), desactivado por defecto.
- **FR-004**: Las clases Concluidas MUST mostrarse con una etiqueta visual diferenciada en todos los listados donde aparezcan.
- **FR-005**: Una clase Concluida MUST bloquear la creación de nuevas sesiones y nuevas inscripciones.
- **FR-006**: El Escolástico MUST poder editar los campos de metadatos de una clase Concluida (comentarios, celador, fechas). Los Instructores NO pueden editar datos de clases Concluidas.
- **FR-007**: El acceso al detalle y al historial completo de una clase Concluida MUST estar disponible para Escolástico e Instructor (Instructor: solo lectura).

### Key Entities *(include if feature involves data)*

- **Clase**: Entidad existente. El estado `Concluida` es el estado terminal del ciclo de vida de una clase. Reutiliza o extiende el estado `Finalizada` existente (decisión de planificación).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El Escolástico puede concluir una clase en menos de 3 clics desde el detalle de la misma.
- **SC-002**: Tras concluir una clase, el 100% de sus datos históricos es consultable sin pérdida de información.
- **SC-003**: El filtro histórico en listas de clases responde en menos de 2 segundos.
- **SC-004**: El 100% de los intentos de escritura sobre una clase Concluida por parte de un Instructor son rechazados con mensaje de error claro.

### Assumptions

- **A-001**: El estado `Finalizada` existente se considera equivalente a `Concluida`; la implementación puede reutilizarlo o renombrarlo. Decisión diferida a planificación.
- **A-002**: Los campos editables en una clase Concluida son: comentarios, celador y fechas de inicio/fin. No incluye cambiar instructor ni materia.
- **A-003**: El filtro histórico está desactivado por defecto en todas las vistas; el usuario debe activarlo explícitamente.
- **A-004**: Los instructores pueden consultar el historial de sus propias clases concluidas, no el de clases de otros instructores.
