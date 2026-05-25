# Research: Panel de Notificaciones de Actividad Reciente

**Branch**: `030-activity-notifications` | **Date**: 2026-05-25

## Decision 1: Nueva tabla vs. reutilizar `logs_auditoria`

**Decision**: Crear una nueva tabla `notificaciones_actividad` independiente de `logs_auditoria`.

**Rationale**: `logs_auditoria` es un log de auditoría técnico de bajo nivel: captura operaciones INSERT/UPDATE/DELETE con valores JSON sin procesar (`valor_anterior`, `valor_nuevo`). Su propósito es trazabilidad interna para administradores técnicos. Las notificaciones de actividad son un feed de eventos orientado al usuario: requieren texto legible en español, contexto estructurado (nombre de clase, nombre de miembro, número de asistentes) y semántica de dominio ("pase de lista" vs. "UPDATE en tabla asistencias"). Acoplar el display de notificaciones al audit log crearía dependencia frágil ante cambios de esquema del log y requeriría lógica compleja para reconstruir contexto legible desde JSON crudo.

**Alternatives considered**:
- Reutilizar `logs_auditoria` con una capa de formato → Rechazada: los campos `accion` y `tabla_afectada` no tienen suficiente contexto semántico para generar mensajes legibles; los blobs JSON no tienen estructura estable garantizada.
- Vista de base de datos sobre `logs_auditoria` → Rechazada por las mismas razones; además no permite gestionar estado de lectura per-user.

---

## Decision 2: Estado de lectura — timestamp por usuario vs. tabla de unión

**Decision**: Tabla `notificaciones_ultima_vista` con un registro por usuario (clave primaria: `usuario_id`) almacenando un único timestamp `ultima_vista`.

**Rationale**: El comportamiento requerido es "contador de notificaciones no vistas desde la última apertura del panel". Un timestamp es exactamente el predicado necesario: `COUNT(*) WHERE created_at > ultima_vista`. Cuando el usuario abre el panel, se actualiza el timestamp a `NOW()`. Este enfoque es O(1) para marcar como leído y O(log n) para el conteo. La tabla ocupa 1 fila por usuario activo, no crece con el volumen de notificaciones.

**Alternatives considered**:
- Tabla de unión `notificaciones_vistas(usuario_id, notificacion_id, leida_en)` → Rechazada: crece O(usuarios × notificaciones); para el caso de uso actual (contador + reset-al-abrir) no aporta beneficio adicional. Las notificaciones individuales no necesitan granularidad de lectura — o se ve el panel o no.
- Campo `ultima_vista_notificaciones` en tabla `usuarios` → Rechazada: la Constitución prohíbe modificar tablas base existentes para incorporar nuevas funcionalidades cuando es evitable.

---

## Decision 3: Generación de notificaciones — sincrónica vs. asíncrona

**Decision**: Generación sincrónica directa, idéntica al patrón `AuditoriaService.log()`.

**Rationale**: El proyecto ya tiene un patrón establecido: los servicios inyectan `AuditoriaService` y llaman `this.auditoria.log(payload)` de forma fire-and-forget (la llamada no bloquea la respuesta principal; errores son capturados y logueados sin propagar). `NotificacionesService.registrar()` seguirá exactamente el mismo patrón. El volumen de eventos es bajo (no cientos por segundo), por lo que no se justifica introducir un sistema de eventos o colas.

**Alternatives considered**:
- NestJS EventEmitter (patrón pub/sub interno) → Rechazada: añade indirección y complejidad sin beneficio real a esta escala. El acoplamiento directo servicio→NotificacionesService es aceptable.
- Sistema de colas externo (Redis/BullMQ) → Rechazada: sobreingeniería; la Constitución establece que la simplicidad prevalece sobre la sofisticación técnica.

---

## Decision 4: Arquitectura del módulo NestJS

**Decision**: Nuevo módulo `notificaciones` con `NotificacionesService`, `NotificacionesController`, `NotificacionesModule`. Se inyecta `NotificacionesService` en `AsistenciasService`, `InscripcionesService` y `UsersService`.

**Rationale**: Sigue exactamente el patrón de `AuditoriaModule` / `AuditoriaService`. La integración en los tres puntos de disparo es mínima: una línea fire-and-forget al final de cada operación (`bulkUpsert`, `registrarBaja`, `promote`). El módulo queda encapsulado y no requiere modificar lógica de negocio existente, solo añadir la llamada de notificación.

**Integration points identified**:
- `AsistenciasService.bulkUpsert()` → dispara `pase_de_lista` (incluye clase_id, actor_id, count de presentes)
- `InscripcionesService.registrarBaja()` → dispara `baja_inscrito` (incluye clase_id, usuario_afectado_id, actor_id)
- `UsersService.promote()` → dispara `promocion_miembro` (incluye usuario_afectado_id, actor_id)

---

## Decision 5: Frontend — componente de notificaciones

**Decision**: `NotificacionesButton` (MUI `Badge` + `IconButton`) insertado en el `AppBar` del `AdminLayout`. Al hacer clic abre un `Popover` / `Drawer` (mobile: Drawer, desktop: Popover). Link "Ver todas" navega a `/admin/notificaciones`.

**Rationale**: MUI ya está en el proyecto. `Badge` sobre `IconButton` con `NotificationsIcon` es el patrón estándar de MUI para notification bells. El contador se obtiene del mismo endpoint `GET /notificaciones` al cargar el layout. La página de historial sigue el patrón de las páginas admin existentes (tabla + filtros).

**Alternatives considered**:
- Notificaciones en sidebar → Rechazada: la spec especifica "cabecera visible desde cualquier pantalla".
- Polling con setInterval → Diferida: la spec acepta actualización por recarga de página; tiempo real es iteración futura.
