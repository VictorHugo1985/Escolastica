# Data Model: Panel de Notificaciones de Actividad Reciente

**Branch**: `030-activity-notifications` | **Date**: 2026-05-25
**Cross-reference**: Spec 002 (Diccionario de Datos)

## New Tables

### `notificaciones_actividad`

Registro persistente de una acción del sistema con contexto legible para el usuario. Solo se crean registros; nunca se actualizan ni eliminan (inmutables, para auditoría).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador único |
| `tipo` | VARCHAR(50) | NOT NULL | Tipo de acción: `pase_de_lista`, `baja_inscrito`, `promocion_miembro` |
| `descripcion` | TEXT | NOT NULL | Mensaje legible en español generado al crear el registro |
| `actor_id` | UUID | FK → usuarios(id), SET NULL on delete | Usuario que realizó la acción |
| `clase_id` | UUID | FK → clases(id), SET NULL on delete, nullable | Clase afectada (aplica a pase_de_lista y baja_inscrito) |
| `usuario_afectado_id` | UUID | FK → usuarios(id), SET NULL on delete, nullable | Miembro afectado (aplica a baja_inscrito y promocion_miembro) |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Marca de tiempo del evento |

**Indexes**:
- `idx_notificaciones_created_at DESC` — para consultas recientes (panel de cabecera)
- `idx_notificaciones_tipo` — para filtros por tipo en historial

**Constraints**:
- `tipo` debe pertenecer al conjunto `{'pase_de_lista', 'baja_inscrito', 'promocion_miembro'}`
- `descripcion` máximo 500 caracteres

**Descripción generada por tipo**:
- `pase_de_lista`: `"[NombreInstructor] pasó lista en [NombreClase]: [N] asistentes"`
- `baja_inscrito`: `"[NombreActor] dio de baja a [NombreMiembro] de [NombreClase]"`
- `promocion_miembro`: `"[NombreActor] promovió a [NombreMiembro] a Miembro"`

---

### `notificaciones_ultima_vista`

Almacena el timestamp de la última vez que cada usuario abrió el panel de notificaciones. Se usa para calcular el contador de no leídas: `COUNT(*) FROM notificaciones_actividad WHERE created_at > ultima_vista`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `usuario_id` | UUID | PK, FK → usuarios(id), CASCADE on delete | Usuario propietario del registro |
| `ultima_vista` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Timestamp de la última apertura del panel |

**Behavior**:
- Se crea con `UPSERT` la primera vez que el usuario abre el panel.
- Se actualiza con `UPDATE SET ultima_vista = NOW()` cada vez que el usuario abre el panel.
- Si el usuario nunca abrió el panel, el registro no existe → contador = total de notificaciones disponibles (limitado a las últimas 20 en el panel).

---

## Prisma Schema Additions

```prisma
model notificaciones_actividad {
  id                   String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tipo                 String   @db.VarChar(50)
  descripcion          String   @db.Text
  actor_id             String?  @db.Uuid
  clase_id             String?  @db.Uuid
  usuario_afectado_id  String?  @db.Uuid
  created_at           DateTime @default(now()) @db.Timestamptz(6)

  actor            usuarios? @relation("NotificacionActor", fields: [actor_id], references: [id], onDelete: SetNull)
  clase            clases?   @relation(fields: [clase_id], references: [id], onDelete: SetNull)
  usuario_afectado usuarios? @relation("NotificacionAfectado", fields: [usuario_afectado_id], references: [id], onDelete: SetNull)

  @@index([created_at(sort: Desc)])
  @@index([tipo])
}

model notificaciones_ultima_vista {
  usuario_id   String   @id @db.Uuid
  ultima_vista DateTime @default(now()) @db.Timestamptz(6)

  usuario usuarios @relation(fields: [usuario_id], references: [id], onDelete: Cascade)
}
```

**Additions required in existing models** (back-relations only, no field changes):

```prisma
// In model usuarios — add back-relations:
notificaciones_como_actor    notificaciones_actividad[] @relation("NotificacionActor")
notificaciones_como_afectado notificaciones_actividad[] @relation("NotificacionAfectado")
notificaciones_ultima_vista  notificaciones_ultima_vista?

// In model clases — add back-relation:
notificaciones notificaciones_actividad[]
```

---

## Relationships

```
usuarios ──< notificaciones_actividad (actor_id)         [1:N, SET NULL]
usuarios ──< notificaciones_actividad (usuario_afectado_id) [1:N, SET NULL]
clases   ──< notificaciones_actividad (clase_id)         [1:N, SET NULL]
usuarios ──< notificaciones_ultima_vista (usuario_id)    [1:1, CASCADE]
```

---

## No modifications to existing tables

La Constitución exige extensiones compatibles. Este diseño solo añade:
1. Dos nuevas tablas (`notificaciones_actividad`, `notificaciones_ultima_vista`)
2. Back-relations en `usuarios` y `clases` (no son campos físicos — solo metadata de Prisma)

Ninguna columna existente se modifica.
