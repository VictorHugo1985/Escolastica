# Research: Notificación de Clases sin Sesiones Recientes

**Feature**: 031-inactive-classes-alert | **Date**: 2026-07-10

## D1 — Reutilizar `notificaciones_actividad` con un nuevo `tipo`

**Decision**: Registrar la alerta como una fila más de `notificaciones_actividad` con `tipo = 'clase_inactiva'`, `actor_id = null`, `clase_id = null` y la lista de clases dentro de `descripcion`.

**Rationale**:
- `tipo` es `VarChar(50)` sin constraint en BD; añadir un valor nuevo no requiere migración (cumple Data-First: extensión sin alterar estructura).
- La notificación hereda gratis todo el pipeline de Spec 030: panel, contador de no leídas, historial, filtros y paginación.
- `clase_id` queda null porque la alerta agrega N clases; el detalle viaja en la descripción legible (FR-003, FR-009).

**Alternatives considered**:
- *Tabla nueva `alertas_clases_inactivas`*: rechazada; duplica infraestructura (endpoints, panel, contador) para el mismo concepto de "notificación" y viola la preferencia por simplicidad.
- *Una notificación por clase inactiva*: rechazada; la descripción del usuario pide explícitamente "una notificación en la que se listen las clases", y N filas por día generarían ruido en el panel.

## D2 — Evaluación perezosa (lazy) al consultar el panel

**Decision**: `NotificacionesService.getRecientes()` invoca `evaluarClasesInactivas()` (fire-and-forget con manejo de errores, mismo patrón que `registrar()`) antes de devolver la lista. No se agrega scheduler.

**Rationale**:
- El monorepo se despliega en Vercel; no hay garantía de un proceso NestJS persistente donde un cron de `@nestjs/schedule` corra confiablemente, y no existe hoy ninguna dependencia de scheduling en `apps/api`.
- El panel de notificaciones se abre varias veces al día por Escolástico/instructores; la primera apertura del día dispara la evaluación, cumpliendo el efecto de FR-004 (evaluación diaria sin intervención manual: el usuario no "pide" la evaluación, solo abre su panel).
- Costo trivial: una consulta agregada sobre ~50 clases activas; no compromete SC-001 de Spec 030 (< 1s).
- Sin usuarios activos no hay evaluación, pero tampoco hay nadie a quien alertar; el estado se recalcula al volver.

**Alternatives considered**:
- *`@nestjs/schedule` (cron in-process)*: rechazada; requiere proceso persistente y una dependencia nueva, sin beneficio observable para el usuario.
- *Vercel Cron + endpoint dedicado*: viable como refuerzo futuro si se requiere puntualidad estricta de 24h; se descarta en esta iteración por simplicidad (requiere endpoint público protegido y configuración de infraestructura).

## D3 — Notificación agregada única, actualizada solo si cambia el contenido

**Decision**: En cada evaluación se busca la notificación `clase_inactiva` más reciente del día (`created_at >= inicio del día`). Si la lista calculada es no vacía: si no existe notificación hoy se crea; si existe y su `descripcion` difiere de la recalculada, se actualiza (`descripcion` + `created_at = now()`); si es idéntica, no se toca. Si la lista es vacía, no se crea ni actualiza nada.

**Rationale**:
- Cumple FR-005 (sin duplicados por día) y SC-003 (máx. una notificación por día).
- No actualizar cuando el contenido no cambió evita que cada apertura del panel "reviva" la notificación como no leída para los demás usuarios.
- Refrescar `created_at` cuando sí cambia la lista la sube al tope del panel y la marca como nueva actividad — consistente con la deduplicación del pase de lista (FR-005 de Spec 030).

**Alternatives considered**:
- *Actualizar siempre el timestamp*: rechazada; convertiría la alerta en permanentemente "no leída".
- *Deduplicar contra la última notificación sin importar el día*: rechazada; el registro diario en el historial documenta la persistencia del problema (valor de trazabilidad de User Story 2).

## D4 — Consulta de detección

**Decision**: Dos consultas Prisma: (1) `clases.findMany({ where: { estado: 'Activa' } })` con `materia.nombre` y `codigo`; (2) `sesiones.groupBy({ by: ['clase_id'], _max: { fecha: true } })`. En memoria: para cada clase activa, `fechaReferencia = MAX(sesiones.fecha) ?? max(fecha_inicio, /* clase sin sesiones */)`; es inactiva si `hoy - fechaReferencia >= 15 días`. Los días de inactividad reportados son `floor((hoy - fechaReferencia) / 86400s)`.

**Rationale**:
- `sesiones.fecha` (`@db.Date`) es la fuente de verdad del modelo de sesiones académicas (Spec 003); `created_at` de la sesión no representa el día académico.
- Para clases sin sesiones, `fecha_inicio` de la clase es el punto de partida natural (FR-002); se usa `fecha_inicio` y no `created_at` porque una clase puede registrarse antes de comenzar.
- `groupBy` evita N+1; a esta escala (~50 clases) el cálculo en memoria es inmediato.

**Alternatives considered**:
- *SQL crudo con `LEFT JOIN LATERAL`*: rechazado; Prisma `groupBy` es suficiente y mantiene el código idiomático del proyecto.
- *Umbral configurable en `configuracion_enums`*: fuera de alcance según Assumptions de la spec; el valor 15 se define como constante nombrada para facilitar su futura parametrización.

## D5 — Notificación de sistema (actor null)

**Decision**: `actor_id = null` identifica la notificación como generada por el sistema. El frontend muestra el nuevo tipo con ícono propio (p. ej. reloj/advertencia) y, donde correspondería el actor, la etiqueta "Sistema".

**Rationale**:
- `actor_id` ya es nullable (por `onDelete: SetNull`); no se requiere cambio de esquema.
- El `NotificacionesButton` y la página de historial ya manejan `actor: null` (caso "Usuario eliminado"); solo se ajusta la etiqueta para este tipo.

**Alternatives considered**:
- *Usuario sintético "Sistema" en la tabla `usuarios`*: rechazado; contamina la tabla de usuarios reales y complica autenticación/roles.
