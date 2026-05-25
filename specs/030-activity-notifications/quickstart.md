# Quickstart: Panel de Notificaciones de Actividad Reciente

**Branch**: `030-activity-notifications`

## Secuencia de implementación

1. **Base de datos** → 2. **Backend (API)** → 3. **Shared DTOs** → 4. **Frontend**

---

## Paso 1: Migración de base de datos

Añadir los dos nuevos modelos a `packages/database/schema.prisma`:

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

Añadir back-relations en `usuarios` y `clases` (ver `data-model.md`). Luego:

```bash
npm run db:generate
npm run db:migrate
```

---

## Paso 2: Módulo NestJS `notificaciones`

Crear `apps/api/src/notificaciones/` con:
- `notificaciones.module.ts`
- `notificaciones.service.ts` — métodos: `registrar(payload)`, `getRecientes(usuarioId)`, `getHistorial(usuarioId, filters)`, `marcarLeidas(usuarioId)`
- `notificaciones.controller.ts` — endpoints: `GET /notificaciones`, `GET /notificaciones/historial`, `PUT /notificaciones/marcar-leidas`

Ver contrato completo en `contracts/api-notificaciones.md`.

### Registro de notificaciones en servicios existentes

En cada punto de disparo, inyectar `NotificacionesService` y añadir una llamada fire-and-forget al final del método exitoso:

```typescript
// Ejemplo en AsistenciasService.bulkUpsert() — después del $transaction:
this.notificaciones.registrar({
  tipo: 'pase_de_lista',
  actor_id: actorId,
  clase_id: claseIdRow!.clase_id,
  nombre_clase: claseNombre,
  nombre_actor: actorNombre,
  total_presentes: presentes,
}).catch((e) => this.logger.error('Error al registrar notificación', e));
```

Aplicar el mismo patrón en `InscripcionesService.registrarBaja()` y `UsersService.promote()`.

---

## Paso 3: Shared DTOs

Añadir `packages/shared/src/schemas/notificacion.schema.ts` con:
- `NotificacionPayload` union type (ver `contracts/api-notificaciones.md`)
- `GetNotificacionesResponseDto`
- `GetHistorialResponseDto`

Exportar desde `packages/shared/src/index.ts`.

---

## Paso 4: Frontend

### 4a. Componente `NotificacionesButton`

Crear `apps/web/src/components/layout/NotificacionesButton.tsx`:
- MUI `Badge` con `NotificationsIcon`
- Al montar: fetch `GET /notificaciones` para obtener el contador
- Al hacer clic: abre `Popover` (desktop) o `Drawer` (mobile) con las últimas 20 notificaciones
- Al abrir: llama `PUT /notificaciones/marcar-leidas` → reinicia el contador
- Enlace "Ver todas" → `/admin/notificaciones`

### 4b. Integración en AppBar

En `apps/web/src/app/(admin)/layout.tsx`, añadir `<NotificacionesButton />` dentro del `<Toolbar>` a la derecha del título "Escolastica".

### 4c. Página de historial

Crear `apps/web/src/app/(admin)/admin/notificaciones/page.tsx`:
- Tabla MUI con columnas: Tipo (chip), Descripción, Actor, Fecha
- Filtro por tipo de acción (select)
- Paginación del lado del servidor

---

## Estructura de archivos resultante

```
apps/api/src/notificaciones/
├── notificaciones.module.ts
├── notificaciones.service.ts
└── notificaciones.controller.ts

apps/web/src/components/layout/
└── NotificacionesButton.tsx         (nuevo)

apps/web/src/app/(admin)/admin/
└── notificaciones/
    └── page.tsx                     (nueva página)

packages/shared/src/schemas/
└── notificacion.schema.ts           (nuevo)

packages/database/schema.prisma      (añadir 2 modelos + back-relations)
```
