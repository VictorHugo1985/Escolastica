# Feature Specification: Panel de Notificaciones de Actividad Reciente

**Feature Branch**: `030-activity-notifications`
**Created**: 2026-05-25
**Status**: Draft
**Input**: User description: "incluir notificaciones en las que muestren las ultimas acciones realizadas en la aplicaciones, por ejemplo y principalmente los ultimos pases de lista, baja de inscritos en clases, paso de probacionista a miembro, etc"

## Clarifications

<!--
  This section records decisions made during /speckit.clarify sessions.
  Do not edit manually unless correcting typos.
-->

### Session 2026-05-25

- Q: ¿Qué notificaciones puede ver cada rol (admin vs instructor)? → A: Todos los usuarios con acceso (admin e instructor) ven todas las notificaciones del sistema sin distinción de rol.
- Q: ¿El estado leído/no leído es por usuario o global? → A: Por usuario — cada admin/instructor tiene su propio contador de no leídas independiente.
- Q: ¿Las notificaciones son navegables (clic lleva al recurso)? → A: No — las notificaciones son solo informativas; no hay navegación al registro relacionado.
- Q: ¿Los usuarios ven notificaciones de sus propias acciones? → A: Sí — todos ven el conjunto completo de notificaciones incluyendo las generadas por sus propias acciones.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar actividad reciente desde la cabecera (Priority: P1)

Como administrador o instructor, quiero ver un resumen de las últimas acciones realizadas en la aplicación sin abandonar la pantalla actual, para mantenerme al tanto de los cambios importantes de un vistazo.

**Why this priority**: Es el punto de entrada principal a las notificaciones. Permite al usuario supervisar el estado del sistema de forma rápida y frecuente sin interrumpir su flujo de trabajo actual.

**Independent Test**: Se puede probar de forma independiente abriendo el panel de notificaciones con datos de prueba preexistentes (asistencias, bajas, promociones) y verificando que aparecen en orden cronológico descendente.

**Acceptance Scenarios**:

1. **Dado** que el usuario está en cualquier pantalla de la aplicación, **Cuando** hace clic en el ícono de notificaciones en la cabecera, **Entonces** se despliega un panel con las últimas 20 acciones realizadas, ordenadas de más reciente a más antigua.

2. **Dado** que se han registrado nuevas acciones desde la última visita del usuario, **Cuando** el usuario carga cualquier página de la aplicación, **Entonces** el ícono de notificaciones muestra un contador con el número de acciones no vistas.

3. **Dado** que el usuario abre el panel de notificaciones, **Cuando** hace clic en "Ver todas", **Entonces** navega a una página dedicada con el historial completo de actividad con paginación.

4. **Dado** que el usuario abre el panel de notificaciones, **Cuando** cierra el panel, **Entonces** el contador de no leídas se reinicia a cero para esas notificaciones.

---

### User Story 2 - Identificar el detalle de cada acción (Priority: P1)

Como administrador, quiero que cada notificación me indique claramente qué acción se realizó, quién la ejecutó, sobre qué clase o miembro y cuándo ocurrió, para poder actuar sobre la información sin navegar a otra sección.

**Why this priority**: Sin contexto suficiente, las notificaciones no aportan valor operativo. El detalle es lo que permite tomar decisiones informadas rápidamente.

**Independent Test**: Verificar que una notificación de pase de lista muestre: nombre de la clase, instructor responsable, número de asistentes y tiempo transcurrido. Verificar lo mismo para bajas y promociones.

**Acceptance Scenarios**:

1. **Dado** que se realizó un pase de lista, **Cuando** el usuario ve la notificación correspondiente, **Entonces** puede leer: nombre de la clase, instructor que pasó lista, número de asistentes registrados y tiempo transcurrido (ej. "hace 5 minutos").

2. **Dado** que se dio de baja a un inscrito en una clase, **Cuando** el usuario ve la notificación, **Entonces** puede leer: nombre del miembro dado de baja, nombre de la clase afectada, usuario que realizó la baja y tiempo transcurrido.

3. **Dado** que un probacionista fue promovido a miembro, **Cuando** el usuario ve la notificación, **Entonces** puede leer: nombre del probacionista promovido, usuario que realizó el cambio y tiempo transcurrido.

---

### User Story 3 - Filtrar el historial completo de actividad (Priority: P2)

Como administrador, quiero filtrar el historial de notificaciones por tipo de acción para localizar eventos específicos de forma ágil.

**Why this priority**: A medida que la actividad crece, un historial sin filtros se vuelve difícil de revisar. Filtrar por tipo reduce el tiempo de búsqueda significativamente.

**Independent Test**: En la página de historial, aplicar el filtro "Pases de lista" y verificar que solo se muestran notificaciones de ese tipo; limpiar el filtro y verificar que reaparecen todas.

**Acceptance Scenarios**:

1. **Dado** que el usuario está en la página de historial de actividad, **Cuando** selecciona el filtro "Pases de lista", **Entonces** solo se muestran notificaciones de tipo pase de lista.

2. **Dado** que el usuario tiene un filtro activo, **Cuando** limpia el filtro, **Entonces** se vuelven a mostrar todas las acciones disponibles.

3. **Dado** que hay múltiples páginas de historial, **Cuando** el usuario navega entre páginas, **Entonces** el filtro aplicado se mantiene activo.

---

### Edge Cases

- ¿Qué ocurre si no hay actividad reciente? → Se muestra un mensaje vacío: "No hay actividad reciente."
- ¿Qué ocurre si la acción fue realizada por un usuario que ya no existe en el sistema? → Se muestra "Usuario eliminado" como actor de la notificación.
- ¿Qué ocurre si se generan muchas acciones en poco tiempo (ej. múltiples pases de lista seguidos)? → Cada acción genera una notificación independiente; el panel limita la vista a las últimas 20 y remite al historial completo.
- ¿Qué ocurre si el usuario tiene rol de miembro regular? → No puede ver las notificaciones de actividad del sistema.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar un ícono indicador de notificaciones en la cabecera, visible desde cualquier pantalla de la aplicación para usuarios con rol administrador o instructor.
- **FR-002**: El sistema DEBE mostrar un contador numérico de notificaciones no leídas sobre el ícono de la cabecera cuando existan acciones nuevas.
- **FR-003**: Al abrir el panel de notificaciones, el sistema DEBE listar las últimas 20 acciones realizadas, ordenadas de más reciente a más antigua.
- **FR-004**: Cada notificación DEBE incluir: tipo de acción (con ícono o etiqueta distintiva), entidades involucradas (nombre de clase y/o nombre de miembro/instructor), nombre del usuario que realizó la acción y marca de tiempo relativa (ej. "hace 5 minutos", "hace 2 horas"). Las notificaciones son solo informativas: no son elementos clicables que naveguen a otro recurso.
- **FR-005**: El sistema DEBE registrar automáticamente una notificación cada vez que se complete un pase de lista. Si ya existe una notificación de pase de lista con la misma fecha (día calendario), mismo usuario actor y misma clase, el sistema DEBE actualizar esa notificación existente (descripción y marca de tiempo) en lugar de crear una nueva, de modo que múltiples actualizaciones de asistentes de una misma clase en el mismo día generen una sola alerta.
- **FR-006**: El sistema DEBE registrar automáticamente una notificación cada vez que se dé de baja a un inscrito en una clase.
- **FR-007**: El sistema DEBE registrar automáticamente una notificación cada vez que un probacionista sea promovido a miembro.
- **FR-008**: El sistema DEBE marcar las notificaciones como "leídas" cuando el usuario abra el panel de notificaciones.
- **FR-009**: El panel de cabecera DEBE incluir un enlace a una página de historial completo de actividad.
- **FR-010**: La página de historial completo DEBE permitir filtrar notificaciones por tipo de acción.
- **FR-011**: La página de historial completo DEBE soportar paginación para manejar grandes volúmenes de actividad.
- **FR-012**: Solo usuarios con rol administrador o instructor DEBEN poder ver las notificaciones de actividad del sistema. Ambos roles ven el mismo conjunto completo de notificaciones sin distinción de alcance.

### Key Entities *(include if feature involves data)*

<!--
  IMPORTANT: New entities or fields MUST be cross-referenced with Spec 003.
  If this feature adds a table, it should be marked for inclusion in Spec 003.
-->

- **Notificación de Actividad**: Registro persistente de una acción del sistema. Atributos: identificador único, tipo de acción (pase_de_lista | baja_inscrito | promocion_miembro), descripción legible generada automáticamente, referencia al usuario actor, referencias a entidades afectadas (clase, miembro), marca de tiempo de creación.
- **Estado de Lectura de Notificación**: Registro por usuario que indica si un usuario específico ha leído una notificación. Relación: usuario ↔ notificación (uno a muchos). El contador de no leídas de la cabecera se calcula por usuario a partir de este registro.
- **Tipo de Acción**: Categoría enumerada que clasifica el evento. Valores iniciales: pase de lista, baja de inscrito en clase, promoción de probacionista a miembro.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El panel de notificaciones se abre en menos de 1 segundo desde que el usuario hace clic en el ícono.
- **SC-002**: El 100% de los pases de lista, bajas de inscritos y promociones de probacionistas completados generan automáticamente una notificación visible en el panel.
- **SC-003**: Los usuarios pueden identificar el tipo de acción, actor, entidad afectada y tiempo transcurrido de cualquier notificación sin necesidad de navegar a otra pantalla.
- **SC-004**: El historial de actividad soporta al menos 12 meses de registros sin degradación perceptible en el tiempo de carga de la página.
- **SC-005**: El contador de notificaciones no leídas en la cabecera refleja el estado correcto en cada carga de página.

## Assumptions

- Las notificaciones son visibles únicamente para administradores e instructores; los miembros regulares no tienen acceso a este panel. Ambos roles ven el mismo conjunto completo de notificaciones, incluyendo las generadas por sus propias acciones.
- El contador de no leídas se actualiza en cada carga de página (no en tiempo real); la actualización automática sin recarga puede evaluarse en una iteración futura.
- Los tipos de acción iniciales son: pase de lista, baja de inscrito y promoción a miembro. Acciones adicionales (nuevas inscripciones, cancelaciones de clases, etc.) pueden incorporarse en iteraciones futuras.
- Las notificaciones no se eliminan del historial; se mantiene un registro permanente para fines de auditoría.
- El tiempo relativo (ej. "hace 5 minutos") se muestra para eventos recientes; eventos con más de 24 horas muestran la fecha completa.
