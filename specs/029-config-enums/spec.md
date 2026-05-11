# Feature Specification: Configuración de Enumeraciones de la Aplicación

**Feature Branch**: `029-config-enums`
**Created**: 2026-05-11
**Status**: Draft
**Input**: User description: "Incluir una funcionalidad en la que podas configurar desde la app web configurar los enums de la aplicacion, los enums a incluir en la configuracion tienen que ser listados"

## Clarifications

<!--
  This section records decisions made during /speckit.clarify sessions.
  Do not edit manually unless correcting typos.
-->

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gestionar valores de una enumeración (Priority: P1)

El administrador (Escolástico) accede a una pantalla de configuración de enumeraciones dentro de la sección de ajustes de la app web. Desde allí ve la lista de categorías configurables, selecciona una (por ejemplo, "Tipos de sesión"), y puede agregar un nuevo valor, renombrar la etiqueta visible de uno existente, o desactivar un valor que ya no se use. Los cambios se reflejan de inmediato en los formularios y selectores de la aplicación donde aparece esa enumeración.

**Por qué P1**: Los valores de las listas de opciones (tipos de sesión, motivos de baja, escalas de nota) son datos de negocio que el administrador debe poder ajustar sin necesidad de un despliegue técnico.

**Independent Test**: Abrir la pantalla de configuración de enumeraciones → seleccionar "Tipos de sesión" → agregar el valor "Taller" → ir a registrar una sesión en una clase → verificar que "Taller" aparece como opción en el selector de tipo de sesión.

**Acceptance Scenarios**:

1. **Given** el administrador está autenticado, **When** accede a Configuración → Enumeraciones, **Then** ve una lista con las 4 categorías configurables, cada una con su nombre y cantidad de valores activos.

2. **Given** el administrador seleccionó la categoría "Motivos de baja", **When** agrega el valor "Médico" con etiqueta "Licencia Médica", **Then** el nuevo valor aparece en la lista y está disponible en el selector de motivo de baja de inscripciones.

3. **Given** existe un valor activo "Repaso" en "Tipos de sesión", **When** el administrador renombra su etiqueta a "Clase de Repaso", **Then** la nueva etiqueta se muestra en todos los selectores y en los registros históricos que usaban ese valor.

4. **Given** el administrador intenta desactivar un valor que está en uso por al menos un registro existente, **When** confirma la acción, **Then** el valor queda desactivado y ya no aparece como opción en formularios nuevos, pero los registros históricos que lo tenían asignado conservan su valor sin alteración.

5. **Given** un valor está desactivado, **When** el administrador lo reactiva, **Then** vuelve a estar disponible en los formularios.

6. **Given** el administrador intenta guardar un valor con etiqueta vacía o duplicada dentro de la misma categoría, **When** intenta confirmar, **Then** se muestra un error y no se guarda el cambio.

---

### User Story 2 - Visualizar enumeraciones no configurables (Priority: P2)

El administrador puede ver en la misma pantalla las enumeraciones estructurales de la aplicación (roles, estados de clase, estados de inscripción, etc.) en modo solo lectura, con una indicación clara de que no son editables y una explicación del motivo.

**Por qué P2**: Da visibilidad completa del sistema sin riesgo de modificaciones accidentales en valores que controlan lógica de negocio crítica.

**Independent Test**: Acceder a la sección de enumeraciones → verificar que las categorías no configurables (Rol, Estado de clase, Estado de asistencia, etc.) aparecen con indicador "Solo lectura" y sin botones de edición.

**Acceptance Scenarios**:

1. **Given** el administrador está en la pantalla de enumeraciones, **When** ve la sección de enumeraciones no configurables, **Then** cada categoría muestra sus valores actuales con etiqueta "Solo lectura — controlado por el sistema".

2. **Given** el administrador intenta editar una enumeración no configurable, **Then** no existe ningún control de edición disponible para esas categorías.

---

### Edge Cases

- ¿Qué pasa si se agrega un valor con código idéntico (ignorando mayúsculas) a uno existente en la misma categoría? → Debe rechazarse como duplicado.
- ¿Qué pasa si se desactivan todos los valores de una categoría? → Se debe advertir que la categoría quedará sin opciones disponibles.
- ¿Qué pasa si un valor desactivado sigue referenciado en registros históricos? → Los registros conservan su valor; no se alteran.
- ¿Qué ocurre si dos administradores editan la misma categoría simultáneamente? → El último guardado prevalece.

## Requirements *(mandatory)*

### Enumeraciones configurables (LISTA EXPLÍCITA)

Las siguientes enumeraciones son configurables desde la pantalla de administración:

| # | Categoría              | Descripción                                             | Valores actuales                                           |
|---|------------------------|---------------------------------------------------------|------------------------------------------------------------|
| 1 | **Estado de Nota**     | Escala de calificaciones usada en inscripciones         | Sobresaliente, Sólido, Aprobado, Reprobado                 |
| 2 | **Tipo de Nota Final** | Tipos de evaluación asignable a una inscripción         | Nota Teórica, Nota Práctica, Examen Final, Trabajo Escrito |
| 3 | **Tipo de Sesión**     | Clasificación de las sesiones de clase                  | Clase, Examen, Práctica, Repaso                            |
| 4 | **Motivo de Baja**     | Razón por la cual un miembro fue dado de baja           | Ausencia, Laboral, Personal, Desconocido                   |

### Enumeraciones NO configurables (solo lectura)

Las siguientes enumeraciones están controladas por la lógica del sistema y no son editables:

| # | Categoría                | Motivo de exclusión                                          |
|---|--------------------------|--------------------------------------------------------------|
| 1 | **Rol**                  | Controla permisos y acceso; cambiarlos afecta seguridad      |
| 2 | **Estado General**       | Valor binario estructural (Activo/Inactivo)                  |
| 3 | **Estado de Clase**      | Máquina de estados con transiciones controladas por reglas   |
| 4 | **Estado de Inscripción**| Máquina de estados; afecta flujos de inscripción y baja      |
| 5 | **Estado de Asistencia** | Valores con semántica fija en la lógica de asistencia        |

### Functional Requirements

- **FR-001**: Solo los usuarios con rol Escolástico pueden acceder a la pantalla de configuración de enumeraciones.
- **FR-002**: La pantalla DEBE mostrar todas las categorías configurables listadas en la tabla anterior, cada una con sus valores activos e inactivos.
- **FR-003**: El sistema DEBE permitir agregar un nuevo valor a cualquier categoría configurable, indicando una etiqueta en español.
- **FR-004**: El sistema DEBE permitir renombrar la etiqueta visible de un valor existente sin modificar su identificador interno.
- **FR-005**: El sistema DEBE permitir desactivar un valor configurable; los valores desactivados no aparecen en formularios nuevos pero se conservan en registros históricos.
- **FR-006**: El sistema DEBE permitir reactivar un valor previamente desactivado.
- **FR-007**: El sistema DEBE rechazar etiquetas vacías o duplicadas dentro de la misma categoría.
- **FR-008**: Las enumeraciones no configurables DEBEN mostrarse en modo solo lectura con indicación visible de que son controladas por el sistema.
- **FR-009**: Los cambios en valores de enumeración DEBEN reflejarse de inmediato en todos los selectores y formularios de la aplicación que usan esa categoría.
- **FR-010**: Toda acción de creación, modificación o desactivación de un valor DEBE quedar registrada en el log de auditoría con el actor, la categoría afectada, y los valores anterior y nuevo.

### Key Entities

<!--
  IMPORTANT: Nueva entidad requiere referencia en Spec 003 (diccionario de datos).
-->

- **ConfiguracionEnum**: Representa una categoría de enumeración configurable. Atributos: `nombre_categoria` (identificador único, no editable), `etiqueta` (texto visible para el usuario), `descripcion`.

- **ValorEnum**: Representa un valor individual dentro de una categoría configurable. Atributos: `categoria` (referencia a ConfiguracionEnum), `codigo` (identificador interno, único por categoría, no editable tras creación), `etiqueta` (texto visible, editable), `activo` (boolean), `orden` (posición en la lista), `creado_en`, `actualizado_en`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El administrador puede agregar, renombrar o desactivar un valor de enumeración en menos de 30 segundos desde que abre la pantalla.
- **SC-002**: Los cambios en enumeraciones se reflejan en los formularios de la aplicación sin necesidad de recargar la página manualmente.
- **SC-003**: El 100% de los cambios en valores de enumeración queda registrado en el log de auditoría con actor, categoría, acción y valores anterior/nuevo.
- **SC-004**: Los registros históricos que usan un valor desactivado no son afectados; el dato se conserva íntegro.
- **SC-005**: Las enumeraciones no configurables son visibles pero ninguna acción de edición está disponible para ellas.

## Assumptions

- Los valores existentes en la base de datos al momento del despliegue son los valores iniciales de cada categoría configurable.
- El sistema migrará los valores actuales de cada enumeración configurable a la nueva estructura de valores dinámicos durante el despliegue inicial.
- El identificador interno (`codigo`) de cada valor no es editable una vez creado, para preservar la integridad de los registros históricos.
- El orden de los valores en los selectores puede controlarse manualmente desde la pantalla de configuración.
- No se requiere internacionalización (i18n); las etiquetas son en español únicamente.

## Out of Scope

- Creación o eliminación de categorías de enumeración (la lista de 4 categorías configurables es fija).
- Modificación de las enumeraciones no configurables (Rol, EstadoClase, etc.).
- Importación o exportación masiva de valores de enumeración.
- Histórico visual de cambios de etiqueta en pantalla (queda en el log de auditoría, no en la UI).
