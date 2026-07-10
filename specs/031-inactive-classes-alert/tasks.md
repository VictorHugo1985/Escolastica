# Tasks: Notificación de Clases sin Sesiones Recientes

**Input**: Design documents from `/specs/031-inactive-classes-alert/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-notificaciones-extension.md, quickstart.md

**Tests**: No solicitados en la spec; no se generan tareas de test. La verificación es manual según `quickstart.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

*No aplica: no hay proyecto nuevo, dependencias nuevas ni cambios de esquema de base de datos. La extensión opera sobre la infraestructura de Spec 030 ya desplegada.*

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 Añadir `'clase_inactiva'` al enum `TipoNotificacion` y definir `ClaseInactivaPayload` (con `tipo: 'clase_inactiva'`, `actor_id: null`, `clases: Array<{ nombre_clase: string; dias_inactiva: number }>`) sumándolo a la unión `NotificacionPayload` en `packages/shared/src/schemas/notificacion.schema.ts` (ver contrato `contracts/api-notificaciones-extension.md`)

**Checkpoint**: El tipo compartido existe — backend y frontend pueden avanzar en paralelo

---

## Phase 3: User Story 1 - Alerta de clases inactivas en el panel de notificaciones (Priority: P1) 🎯 MVP

**Goal**: Al abrir el panel de notificaciones, el usuario ve una alerta única (deduplicada por día) que lista las clases vigentes con 15+ días sin sesiones, con materia, código y días de inactividad.

**Independent Test**: Con una clase `Activa` cuya última `sesiones.fecha` sea ≥ 15 días atrás, abrir el panel → aparece la alerta con la clase listada. Reabrir el panel → sigue habiendo una sola alerta del día con el mismo `created_at`. Con todas las clases al día → no aparece alerta nueva.

### Implementation for User Story 1

- [X] T002 [US1] Implementar el método privado de detección en `apps/api/src/notificaciones/notificaciones.service.ts`: constante `DIAS_INACTIVIDAD = 15`; consultar `clases.findMany({ where: { estado: 'Activa' }, include: { materia: { select: { nombre: true } } } })` y `sesiones.groupBy({ by: ['clase_id'], _max: { fecha: true } })`; por clase calcular `fechaReferencia = maxFecha ?? fecha_inicio` y `dias = floor((hoyUTC − fechaReferencia) / 1 día)`; devolver las clases con `dias >= 15` ordenadas por días desc como `ClaseInactivaPayload['clases']` (FR-001, FR-002, FR-009; ver `data-model.md`)
- [X] T003 [US1] Implementar `evaluarClasesInactivas()` con el ciclo de deduplicación diaria en `apps/api/src/notificaciones/notificaciones.service.ts`: buscar notificación `tipo: 'clase_inactiva'` con `created_at >= inicio del día UTC`; lista vacía → no-op; sin notificación hoy → `create`; existente con `descripcion` distinta → `update` de `descripcion` y `created_at: new Date()`; idéntica → no-op; todo en try/catch con `this.logger.error` (FR-003, FR-005, FR-006; SC-003)
- [X] T004 [US1] Añadir el caso `clase_inactiva` a `buildDescripcion` en `apps/api/src/notificaciones/notificaciones.service.ts` con formato `"{N} clase(s) sin sesiones recientes: {nombre_clase} — {dias} días; …"` (ver formato exacto en `data-model.md`) e invocar `await this.evaluarClasesInactivas()` al inicio de `getRecientes()` para que la alerta recién creada aparezca en la misma respuesta (FR-004 vía evaluación perezosa, decisión D2 de `research.md`)
- [X] T005 [P] [US1] Añadir el tipo `clase_inactiva` en `apps/web/src/components/layout/NotificacionesButton.tsx`: incluirlo en la unión de `tipo` (línea ~25), añadir entrada en el mapa de etiquetas/colores (línea ~34, p. ej. `{ label: 'Clases inactivas', color: 'warning' }`) con ícono propio (`WarningAmberIcon` o `HistoryToggleOffIcon`), y mostrar "Sistema" en lugar de "Usuario eliminado" cuando `actor` es null y el tipo es `clase_inactiva` (FR-007)

**Checkpoint**: User Story 1 funcional y verificable de forma independiente (pasos 1–4 de `quickstart.md`)

---

## Phase 4: User Story 2 - Consulta en el historial de actividad (Priority: P2)

**Goal**: Las alertas de clases inactivas son consultables y filtrables por tipo en la página de historial de actividad.

**Independent Test**: Con al menos una notificación `clase_inactiva` en BD, en `/admin/notificaciones` seleccionar el filtro "Clases inactivas" → solo se muestran alertas de ese tipo.

### Implementation for User Story 2

- [X] T006 [P] [US2] Añadir `'clase_inactiva'` al enum del `@ApiQuery({ name: 'tipo' })` del endpoint de historial en `apps/api/src/notificaciones/notificaciones.controller.ts` (línea ~26) (FR-008)
- [X] T007 [P] [US2] Añadir `'clase_inactiva'` al arreglo `validTipos` del proxy en `apps/web/src/app/api/notificaciones/historial/route.ts` (línea ~16) para que el filtro no sea rechazado (FR-008)
- [X] T008 [P] [US2] Añadir la opción de filtro `{ value: 'clase_inactiva', label: 'Clases inactivas' }` (línea ~32) y la entrada del mapa de chips `clase_inactiva: { label: 'Clases inactivas', color: 'warning' }` (línea ~38) en `apps/web/src/app/(admin)/admin/notificaciones/page.tsx`, mostrando "Sistema" como actor cuando corresponda (FR-007, FR-008)

**Checkpoint**: User Story 2 funcional — filtro del historial operativo (paso 5 de `quickstart.md`)

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T009 Verificar tipos en ambos extremos: `npx tsc --noEmit` en `apps/api` y `apps/web` (ignorar errores preexistentes de `sesiones/*` por cliente Prisma desactualizado; regenerar con `npx prisma generate` en `packages/database` si es necesario)
- [ ] T010 Ejecutar la validación manual completa de `specs/031-inactive-classes-alert/quickstart.md` (pasos 1–6: alerta visible, deduplicación estable entre aperturas, actualización al registrar sesión, filtro de historial)

### Trabajo descubierto durante la implementación

Durante la implementación se detectó que el frontend consume las rutas API de Next.js (`apps/web/src/app/api/*`, Prisma directo) y no el backend NestJS, que actúa como espejo. Se añadieron dos tareas de paridad:

- [X] T011 [US1] Implementar la evaluación perezosa también en la capa web: helper `evaluarClasesInactivas()` en `apps/web/src/lib/clases-inactivas.ts` (misma lógica de detección y deduplicación que el servicio NestJS) invocado con `await` en el `GET` de `apps/web/src/app/api/notificaciones/route.ts`
- [X] T012 Paridad Spec 030 (FR-005): replicar la deduplicación diaria del pase de lista (mismo día + actor + clase → update en vez de create) en `apps/web/src/app/api/clases/[id]/sesiones/[sesionId]/asistencias/bulk/route.ts`, que creaba una notificación por cada guardado

---

## Dependencies

```text
T001 (shared enum + payload)
 ├─→ T002 → T003 → T004        (backend US1, secuencial: mismo archivo)
 ├─→ T005                      (frontend US1, paralelo al backend)
 ├─→ T006, T007, T008          (US2, paralelos entre sí; independientes de US1)
 └─→ T009 → T010               (polish, tras completar US1 y US2)
```

- **US1 → US2**: independientes en código (archivos distintos), pero para *probar* US2 con datos reales conviene que US1 ya genere notificaciones (alternativa: insertar una fila `clase_inactiva` manualmente).
- T002–T004 son secuenciales por tocar el mismo archivo (`notificaciones.service.ts`).

## Parallel Execution Examples

- Tras T001: un agente avanza T002–T004 (backend) mientras otro hace T005 (frontend US1) y otro T006–T008 (US2) — tres frentes en archivos disjuntos.
- Dentro de US2: T006, T007 y T008 son paralelizables (controller API, proxy web y página son archivos distintos).

## Implementation Strategy

1. **MVP = Phase 2 + Phase 3 (US1)**: con T001–T005 la alerta ya aparece en el panel con deduplicación diaria; entregable y verificable por sí solo.
2. **Incremento US2**: T006–T008 habilitan el filtro del historial; cambio pequeño y de bajo riesgo.
3. **Cierre**: T009–T010 validan tipos y el flujo completo de `quickstart.md`.
