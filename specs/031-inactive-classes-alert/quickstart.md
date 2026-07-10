# Quickstart: Notificación de Clases sin Sesiones Recientes

**Feature**: 031-inactive-classes-alert

Extensión de Spec 030 en 3 pasos, sin cambios de base de datos. Orden recomendado: Shared → API → Frontend.

## Paso 1 — Shared (`packages/shared`)

`src/schemas/notificacion.schema.ts`:
1. Añadir `'clase_inactiva'` al enum `TipoNotificacion`.
2. Añadir `ClaseInactivaPayload` (ver contrato) y sumarlo a la unión `NotificacionPayload`.

## Paso 2 — API (`apps/api/src/notificaciones`)

`notificaciones.service.ts`:
1. Constante `DIAS_INACTIVIDAD = 15`.
2. Nuevo método `evaluarClasesInactivas()`:
   - `clases.findMany({ where: { estado: 'Activa' }, include: { materia: { select: { nombre: true } } } })`
   - `sesiones.groupBy({ by: ['clase_id'], _max: { fecha: true } })`
   - Calcular por clase: `fechaReferencia = maxFecha ?? fecha_inicio`; inactiva si `dias >= 15`; ordenar por días desc.
   - Aplicar el ciclo de deduplicación diaria (ver `data-model.md`): create / update-si-cambió / no-op.
   - Todo dentro de try/catch con `logger.error` (patrón de `registrar()`).
3. Invocar `this.evaluarClasesInactivas().catch(...)` al inicio de `getRecientes()` — con `await` antes de leer la lista, para que la alerta recién creada aparezca en la misma respuesta.
4. `buildDescripcion`: caso `clase_inactiva` → `"{N} clase(s) sin sesiones recientes: {nombre} — {d} días; …"`.

`notificaciones.controller.ts`:
5. Añadir `'clase_inactiva'` al enum del `@ApiQuery({ name: 'tipo' })` del historial.

## Paso 3 — Frontend (`apps/web`)

`src/components/layout/NotificacionesButton.tsx`:
1. Ícono y color para `clase_inactiva` (p. ej. `HistoryToggleOffIcon` o `WarningAmberIcon`).
2. Para este tipo, mostrar "Sistema" donde iría el actor (no "Usuario eliminado").

`src/app/(admin)/admin/notificaciones/page.tsx`:
3. Opción "Clases inactivas" en el filtro por tipo; mismo ícono/etiqueta.

## Verificación

1. En BD de desarrollo, asegurar una clase `Activa` cuya última `sesiones.fecha` sea ≥ 15 días atrás (o sin sesiones y `fecha_inicio` antigua).
2. Abrir el panel de notificaciones → aparece la alerta con materia, código y días.
3. Reabrir el panel varias veces → sigue habiendo una sola alerta del día y no cambia su `created_at`.
4. Registrar un pase de lista en esa clase y reabrir → la alerta se actualiza (o desaparece de futuras evaluaciones si no quedan clases inactivas; la notificación del día ya emitida se actualiza a la lista restante o queda como histórico si la lista queda vacía).
5. En historial, filtrar por "Clases inactivas" → solo aparecen alertas de este tipo.
6. `npx tsc --noEmit` en `apps/api` y `apps/web`; `npm test` en `apps/api` si hay specs afectados.
