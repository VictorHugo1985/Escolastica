# API Contract: Notificaciones de Actividad

**Module**: `NotificacionesModule` | **Base path**: `/notificaciones`
**Auth**: JWT cookie requerido. Acceso restringido a roles `Escolastico` e `Instructor`.

---

## Tipos comunes

```typescript
type TipoNotificacion = 'pase_de_lista' | 'baja_inscrito' | 'promocion_miembro';

interface NotificacionDto {
  id: string;                         // UUID
  tipo: TipoNotificacion;
  descripcion: string;                // Texto legible en español
  actor: { id: string; nombre_completo: string } | null;
  clase: { id: string; codigo: string; materia: string } | null;   // nullable
  usuario_afectado: { id: string; nombre_completo: string } | null; // nullable
  created_at: string;                 // ISO 8601
}
```

---

## Endpoints

### GET /notificaciones

Devuelve las últimas 20 notificaciones y el contador de no leídas para el usuario autenticado.

**Response 200**:
```json
{
  "notificaciones": [NotificacionDto],
  "total_no_leidas": 5
}
```

**Behavior**:
- `total_no_leidas` = `COUNT(*) WHERE created_at > ultima_vista` (o total si el usuario nunca abrió el panel).
- Ordenadas por `created_at DESC`, limitadas a 20.

---

### GET /notificaciones/historial

Devuelve el historial completo con paginación y filtro opcional por tipo.

**Query params**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `tipo` | TipoNotificacion | No | Filtrar por tipo de acción |
| `page` | integer ≥ 1 | No (default: 1) | Página |
| `limit` | integer 1–100 | No (default: 20) | Resultados por página |

**Response 200**:
```json
{
  "notificaciones": [NotificacionDto],
  "total": 142,
  "page": 1,
  "limit": 20,
  "total_pages": 8
}
```

---

### PUT /notificaciones/marcar-leidas

Actualiza `ultima_vista` del usuario autenticado a `NOW()`. Reinicia el contador de no leídas a 0.

**Request body**: vacío (`{}`)

**Response 204**: No Content

**Behavior**: Crea o actualiza el registro en `notificaciones_ultima_vista` para el usuario autenticado.

---

## Internal service interface (NotificacionesService)

Usado internamente por otros módulos para registrar notificaciones. No expuesto como endpoint.

```typescript
// Payloads by type
interface PaseDeListaPayload {
  tipo: 'pase_de_lista';
  actor_id: string;
  clase_id: string;
  nombre_clase: string;        // Para construir descripcion
  nombre_actor: string;        // Para construir descripcion
  total_presentes: number;     // Para construir descripcion
}

interface BajaInscritoPayload {
  tipo: 'baja_inscrito';
  actor_id: string;
  clase_id: string;
  usuario_afectado_id: string;
  nombre_clase: string;
  nombre_actor: string;
  nombre_afectado: string;
}

interface PromocionMiembroPayload {
  tipo: 'promocion_miembro';
  actor_id: string;
  usuario_afectado_id: string;
  nombre_actor: string;
  nombre_afectado: string;
}

type NotificacionPayload = PaseDeListaPayload | BajaInscritoPayload | PromocionMiembroPayload;

// Method signature
class NotificacionesService {
  async registrar(payload: NotificacionPayload): Promise<void>
}
```

**Error handling**: Identical to `AuditoriaService.log()` — errors are caught and logged; they never propagate to the caller.

---

## Integration call sites

| Service | Method | Payload type | Fire-and-forget |
|---------|--------|--------------|-----------------|
| `AsistenciasService` | `bulkUpsert()` | `pase_de_lista` | Yes |
| `InscripcionesService` | `registrarBaja()` | `baja_inscrito` | Yes |
| `UsersService` | `promote()` | `promocion_miembro` | Yes |
