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
    nombre_clase: string;      // "Filosofía I" (nombre de la materia, sin código)
    semanas_inactiva: number;  // semanas completas sin sesiones registradas
  }>;
}

export type NotificacionPayload =
  | PaseDeListaPayload
  | BajaInscritoPayload
  | PromocionMiembroPayload
  | ClaseInactivaPayload;   // ← nuevo
```

## GET /notificaciones/clases-inactivas (nuevo)

Endpoint dedicado para el indicador de la cabecera. Evalúa las clases inactivas (persistiendo/actualizando la alerta del día como efecto colateral) y devuelve la lista vigente:

```json
{
  "clases": [
    { "nombre_clase": "Filosofía I", "semanas_inactiva": 3 },
    { "nombre_clase": "Retórica", "semanas_inactiva": 2 }
  ]
}
```

Roles: Escolástico e Instructor (igual que el resto del módulo). Lista vacía cuando no hay clases inactivas.

## GET /notificaciones

Sin cambios de forma, pero el feed de actividades **excluye** el tipo `clase_inactiva` (tanto de la lista como del contador de no leídas): la alerta vive en su indicador dedicado. El registro persiste en el historial:

```json
{
  "id": "…",
  "tipo": "clase_inactiva",
  "descripcion": "2 clases sin sesiones recientes:\n• Filosofía I — 3 SEM\n• Retórica — 2 SEM",
  "actor": null,
  "clase": null,
  "usuario_afectado": null,
  "created_at": "2026-07-10T14:02:11.000Z"
}
```

`actor: null` en este tipo significa "generada por el sistema" (el historial muestra "Sistema", no "Usuario eliminado").

## GET /notificaciones/historial

`?tipo=` acepta el nuevo valor `clase_inactiva`. Actualizar el `@ApiQuery` enum del controller y el selector de filtro del frontend.

## PUT /notificaciones/marcar-leidas

Sin cambios: el mecanismo de última vista por usuario cubre el nuevo tipo automáticamente.

## Semántica de deduplicación (servidor)

- A lo sumo una notificación `clase_inactiva` por día calendario (UTC).
- `UPDATE` (descripcion + created_at) solo cuando la lista recalculada difiere de la vigente.
- Lista vacía ⇒ no se crea ni actualiza nada ese día.
