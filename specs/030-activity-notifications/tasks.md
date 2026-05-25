# Tasks: Panel de Notificaciones de Actividad Reciente

**Input**: Design documents from `/specs/030-activity-notifications/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | data-model.md ✅ | contracts/ ✅ | research.md ✅ | quickstart.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

- [x] T001 Verify Prisma back-relation naming for `notificaciones_actividad` does not conflict with existing `usuarios` or `clases` relations in `packages/database/schema.prisma`

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Add model `notificaciones_actividad` (fields: id, tipo, descripcion, actor_id, clase_id, usuario_afectado_id, created_at; indexes on created_at DESC and tipo) to `packages/database/schema.prisma` per `data-model.md`
- [x] T003 Add model `notificaciones_ultima_vista` (fields: usuario_id PK, ultima_vista) to `packages/database/schema.prisma` per `data-model.md`
- [x] T004 Add back-relations to existing models in `packages/database/schema.prisma`: `notificaciones_como_actor` and `notificaciones_como_afectado` on `usuarios`, `notificaciones` on `clases`, `notificaciones_ultima_vista` on `usuarios` per `data-model.md`
- [x] T005 Run `npm run db:generate && npm run db:migrate` from repo root to apply schema changes and regenerate Prisma client
- [x] T006 [P] Create `packages/shared/src/schemas/notificacion.schema.ts` with types: `TipoNotificacion`, `PaseDeListaPayload`, `BajaInscritoPayload`, `PromocionMiembroPayload`, `NotificacionPayload` (union), `NotificacionDto`, `GetNotificacionesResponseDto`, `GetHistorialResponseDto` per `contracts/api-notificaciones.md`
- [x] T007 Export new `notificacion.schema.ts` types from `packages/shared/src/index.ts`
- [x] T008 Create NestJS module skeleton: `apps/api/src/notificaciones/notificaciones.service.ts` (empty methods: `registrar`, `getRecientes`, `getHistorial`, `marcarLeidas`), `apps/api/src/notificaciones/notificaciones.controller.ts` (empty), `apps/api/src/notificaciones/notificaciones.module.ts` (imports PrismaModule, exports NotificacionesService)
- [x] T009 Register `NotificacionesModule` in `apps/api/src/app.module.ts` imports array

**Checkpoint**: DB migrated, Prisma client regenerated, shared types compiled, NestJS module registered — user story implementation can begin.

---

## Phase 3: User Story 1 — Panel de actividad reciente en cabecera (Priority: P1) 🎯 MVP

**Goal**: Admin/instructor can open a notification bell in the AppBar and see the last 20 system actions with unread count. Panel marks notifications as read on open. "Ver todas" link navigates to full history.

**Covers**: US1 (panel mechanism) + US2 (notification content/detail) — both P1, implemented as one increment.

**Independent Test**: Perform a `bulkUpsert` (pase de lista), call `GET /notificaciones` and verify the notification appears with correct `tipo`, `descripcion`, `actor`, `clase`, and `created_at`. Open the panel in the UI and confirm the badge counter decrements to 0 after opening.

### Backend — Notification generation and retrieval

- [x] T010 [US1] Implement `NotificacionesService.registrar(payload: NotificacionPayload)` in `apps/api/src/notificaciones/notificaciones.service.ts`: build human-readable `descripcion` string per tipo (`pase_de_lista`: "[Actor] pasó lista en [Clase]: [N] asistentes"; `baja_inscrito`: "[Actor] dio de baja a [Afectado] de [Clase]"; `promocion_miembro`: "[Actor] promovió a [Afectado] a Miembro"), insert into `notificaciones_actividad`; wrap in try/catch and log error without throwing
- [x] T011 [US1] Implement `NotificacionesService.marcarLeidas(usuarioId: string)` in `apps/api/src/notificaciones/notificaciones.service.ts`: upsert `notificaciones_ultima_vista` setting `ultima_vista = NOW()` for the given user
- [x] T012 [US1] Implement `NotificacionesService.getRecientes(usuarioId: string)` in `apps/api/src/notificaciones/notificaciones.service.ts`: query last 20 `notificaciones_actividad` (DESC created_at) with includes for `actor`, `clase` (with `materia`), `usuario_afectado`; compute `total_no_leidas` as count where `created_at > ultima_vista` (or full count if no `notificaciones_ultima_vista` row exists for user)
- [x] T013 [US1] Implement `GET /notificaciones` endpoint in `apps/api/src/notificaciones/notificaciones.controller.ts`: authenticate via `@UseGuards(JwtAuthGuard)`, call `getRecientes(req.user.id)`, return `GetNotificacionesResponseDto`
- [x] T014 [US1] Implement `PUT /notificaciones/marcar-leidas` endpoint in `apps/api/src/notificaciones/notificaciones.controller.ts`: authenticate via `@UseGuards(JwtAuthGuard)`, call `marcarLeidas(req.user.id)`, return 204 No Content

### Backend — Service integration (fire-and-forget)

- [x] T015 [P] [US1] Inject `NotificacionesService` into `AsistenciasService` in `apps/api/src/sesiones/asistencias.service.ts`: add `private readonly notificaciones: NotificacionesService` to constructor; after `$transaction` in `bulkUpsert()` resolves, fetch `clase.materia.nombre` and `actor.nombre_completo` then call `this.notificaciones.registrar({ tipo: 'pase_de_lista', actor_id, clase_id, nombre_clase, nombre_actor, total_presentes })` fire-and-forget; add `AsistenciasModule` import of `NotificacionesModule`
- [x] T016 [P] [US1] Inject `NotificacionesService` into `InscripcionesService` in `apps/api/src/inscripciones/inscripciones.service.ts`: add to constructor; after successful `registrarBaja()`, call `this.notificaciones.registrar({ tipo: 'baja_inscrito', actor_id, clase_id, usuario_afectado_id, nombre_clase, nombre_actor, nombre_afectado })` fire-and-forget; add `NotificacionesModule` import to `InscripcionesModule`
- [x] T017 [P] [US1] Inject `NotificacionesService` into `UsersService` in `apps/api/src/users/users.service.ts`: add to constructor; after successful `promote()`, call `this.notificaciones.registrar({ tipo: 'promocion_miembro', actor_id, usuario_afectado_id, nombre_actor, nombre_afectado })` fire-and-forget; add `NotificacionesModule` import to `UsersModule`

### Frontend — Notification bell and panel

- [x] T018 [P] [US2] Add API client functions `fetchNotificaciones()` and `marcarNotificacionesLeidas()` using `axios` (following existing API call pattern in the project) to a new file `apps/web/src/lib/api/notificaciones.ts`; use types from `@escolastica/shared`
- [x] T019 [P] [US2] Create `apps/web/src/components/layout/NotificacionesButton.tsx` as a `'use client'` component: MUI `IconButton` with `Badge` (`badgeContent={totalNoLeidas}`, color="error") wrapping `NotificationsIcon`; on mount calls `fetchNotificaciones()` and stores result in local state; on click opens MUI `Popover` (desktop, `anchorEl`) or `Drawer` (mobile, use `useMediaQuery`); on open calls `marcarNotificacionesLeidas()` and resets badge to 0
- [x] T020 [US2] Implement notification panel content inside `NotificacionesButton.tsx`: render a `List` with up to 20 `ListItem` entries; each item shows a `Chip` with the `tipo` label (pase de lista / baja inscrito / promoción), the `descripcion` text, actor name, and relative time using `date-fns` `formatDistanceToNow`; if empty, show "No hay actividad reciente."
- [x] T021 [US1] Integrate `NotificacionesButton` into `apps/web/src/app/(admin)/layout.tsx`: add `<NotificacionesButton />` to the right of the "Escolastica" title inside the `<Toolbar>`, visible to all authenticated users (no role filter needed per FR-012 clarification)

**Checkpoint**: US1 + US2 functional. Performing a pase de lista shows a notification in the bell panel with correct description, actor and time. Badge counter resets after opening.

---

## Phase 4: User Story 3 — Historial completo con filtros (Priority: P2)

**Goal**: Admin/instructor can navigate to `/admin/notificaciones`, see the complete paginated notification history, and filter by action type.

**Independent Test**: Call `GET /notificaciones/historial?tipo=pase_de_lista&page=1&limit=20` and verify only `pase_de_lista` notifications are returned with correct `total_pages`. In the UI, apply filter, confirm results, clear filter, confirm all records reappear.

### Backend — Historial endpoint

- [x] T022 [US3] Implement `NotificacionesService.getHistorial(filters: { tipo?, page, limit })` in `apps/api/src/notificaciones/notificaciones.service.ts`: query `notificaciones_actividad` with optional `where: { tipo }`, ordered by `created_at DESC`, with `skip`/`take` pagination; include actor, clase, usuario_afectado; return `{ notificaciones, total, page, limit, total_pages }`
- [x] T023 [US3] Implement `GET /notificaciones/historial` endpoint in `apps/api/src/notificaciones/notificaciones.controller.ts`: parse query params `tipo` (optional), `page` (default 1), `limit` (default 20, max 100) with class-validator or Zod; authenticate via `@UseGuards(JwtAuthGuard)`; return `GetHistorialResponseDto`

### Frontend — History page

- [x] T024 [US3] Create `apps/web/src/app/(admin)/admin/notificaciones/page.tsx` as a `'use client'` page: fetch paginated notifications from `GET /notificaciones/historial` on mount and on filter/page change; display a MUI `Table` with columns: Tipo (Chip), Descripción, Actor, Fecha; show MUI `TablePagination` component
- [x] T025 [US3] Add tipo filter to `apps/web/src/app/(admin)/admin/notificaciones/page.tsx`: MUI `Select` with options "Todos", "Pases de lista", "Bajas de inscritos", "Promociones a miembro"; on change resets page to 1 and refetches; selected filter persists while navigating between pages
- [x] T026 [US3] Add "Ver todas" `Button` (or `Link`) at the bottom of the notification panel inside `apps/web/src/components/layout/NotificacionesButton.tsx` pointing to `/admin/notificaciones`; closes the panel on click

**Checkpoint**: US3 functional. History page loads, filter by type works, pagination works, "Ver todas" link from panel navigates correctly.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T027 [P] Verify mobile responsiveness of `NotificacionesButton.tsx`: test Popover → Drawer switch at MUI `xs` breakpoint; ensure Drawer has a close button and reasonable max-height
- [x] T028 [P] Verify empty states: no notifications → "No hay actividad reciente." in panel; history page empty after filter → "No se encontraron notificaciones para este filtro."
- [x] T029 Validate time display logic in notification panel: events < 24h ago show relative time ("hace 5 minutos"); events ≥ 24h ago show full date ("12 may 2026") using `date-fns` locale `es`
- [x] T030 Run `npm run build` from repo root; fix any TypeScript compilation errors in new files and modified services
- [x] T031 Run through `quickstart.md` end-to-end validation: pase de lista → baja inscrito → promoción → verify all 3 notification types appear in panel and in historial page

---

## Dependencies

```
T001
 └─ T002 → T003 → T004 → T005 (sequential: schema changes must be ordered)
 └─ T006 → T007 (parallel with DB work)
         └─ T008 → T009
                 ├─ T010 → T011 → T012 → T013 → T014 (service logic, sequential)
                 ├─ T015 [P after T010]
                 ├─ T016 [P after T010]
                 ├─ T017 [P after T010]
                 ├─ T018 [P after T007]
                 ├─ T019 [P after T018]
                 └─ T020 → T021 [after T013 + T019]
                         ├─ T022 → T023 [after T009]
                         └─ T024 → T025 → T026 [after T023 + T021]
T027-T031 [after T021 + T026]
```

## Parallel Execution Examples

**Sprint 1 (Foundation)** — sequential by necessity:
`T001 → T002 → T003 → T004 → T005` (schema must be built up incrementally)
`T006 → T007` runs in parallel with T002-T005

**Sprint 2 (US1+US2 Backend)** — after Phase 2:
`T010 → T011 → T012 → T013 → T014` on one track
`T015 + T016 + T017` in parallel (different files) after T010

**Sprint 2 (US1+US2 Frontend)** — after T007:
`T018 → T019 → T020 → T021` runs concurrently with the backend sprint

**Sprint 3 (US3)** — after Phase 3:
`T022 → T023` on backend
`T024 → T025 → T026` on frontend (can start after T023)

---

## Implementation Strategy

**MVP (Phase 2 + Phase 3)**: Deliver the notification bell with live counter, dropdown panel showing last 20 items, and automatic generation for the 3 main action types. This covers 100% of P1 acceptance criteria.

**V1.1 (Phase 4)**: Add the full history page with filters. Adds value but not blocking for daily use.

**Future iterations** (out of scope):
- Real-time counter update via SSE/WebSocket (no page reload needed)
- Additional action types (new enrollments, class cancellations)
- Email/push notification delivery
