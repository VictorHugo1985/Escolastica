# API Contract Extension: Tipo `clase_inactiva`

**Feature**: 031-inactive-classes-alert | **Date**: 2026-07-10
**Extiende**: `specs/030-activity-notifications/contracts/api-notificaciones.md`

No se crean endpoints nuevos. Los 3 endpoints de Spec 030 transportan el nuevo tipo sin cambios de forma.

## Enum extendido

```ts
// packages/shared/src/schemas/notificacion.schema.ts
export const TipoNotificacion = z.enum([
  'pase_de_lista',
  'baja_inscrito',
  'promocion_miembro',
  'clase_inactiva',        // ← nuevo
]);
```

## Payload interno nuevo

Usado por `NotificacionesService` (no viaja por HTTP; la evaluación es interna al servicio):

```ts
export interface ClaseInactivaPayload {
  tipo: 'clase_inactiva';
  actor_id: null;
  clases: Array<{
    nombre_clase: string;   // "Filosofía I (FIL-2026-01)"
    dias_inactiva: number;  // días desde la última sesión o desde fecha_inicio
  }>;
}

export type NotificacionPayload =
  | PaseDeListaPayload
  | BajaInscritoPayload
  | PromocionMiembroPayload
  | ClaseInactivaPayload;   // ← nuevo
```

## GET /notificaciones

Sin cambios de contrato. Efecto colateral nuevo: antes de responder, el servicio ejecuta la evaluación de clases inactivas (fire-and-forget; un fallo en la evaluación no bloquea la respuesta).

Ejemplo de elemento nuevo en la respuesta:

```json
{
  "id": "…",
  "tipo": "clase_inactiva",
  "descripcion": "2 clases sin sesiones recientes: Filosofía I (FIL-2026-01) — 21 días; Retórica (RET-2026-02) — 15 días",
  "actor": null,
  "clase": null,
  "usuario_afectado": null,
  "created_at": "2026-07-10T14:02:11.000Z"
}
```

`actor: null` en este tipo significa "generada por el sistema" (el frontend muestra "Sistema", no "Usuario eliminado").

## GET /notificaciones/historial

`?tipo=` acepta el nuevo valor `clase_inactiva`. Actualizar el `@ApiQuery` enum del controller y el selector de filtro del frontend.

## PUT /notificaciones/marcar-leidas

Sin cambios: el mecanismo de última vista por usuario cubre el nuevo tipo automáticamente.

## Semántica de deduplicación (servidor)

- A lo sumo una notificación `clase_inactiva` por día calendario (UTC).
- `UPDATE` (descripcion + created_at) solo cuando la lista recalculada difiere de la vigente.
- Lista vacía ⇒ no se crea ni actualiza nada ese día.
