# Implementation Plan: Panel de Notificaciones de Actividad Reciente

**Branch**: `030-activity-notifications` | **Date**: 2026-05-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/030-activity-notifications/spec.md`

## Summary

Añadir un panel de notificaciones en la cabecera de la aplicación que muestra las últimas acciones realizadas en el sistema (pases de lista, bajas de inscritos, promociones de probacionistas a miembro). La solución introduce dos nuevas tablas en la base de datos (`notificaciones_actividad`, `notificaciones_ultima_vista`), un nuevo módulo NestJS `notificaciones` que se integra mediante inyección en los servicios existentes (`AsistenciasService`, `InscripcionesService`, `UsersService`), y un componente frontend `NotificacionesButton` insertado en el AppBar del AdminLayout junto con una página de historial completo.

## Technical Context

**Language/Version**: TypeScript 5.4
**Primary Dependencies**: NestJS 10 (backend), Next.js 14 App Router + MUI v5 (frontend), Prisma 5 (ORM), Zod + class-validator (validación), Zustand (estado frontend)
**Storage**: PostgreSQL vía Prisma (Supabase/Vercel hosting)
**Testing**: Vitest
**Target Platform**: Web (mobile-first responsive), deployed on Vercel
**Project Type**: Web application — Turborepo monorepo (`apps/api` NestJS, `apps/web` Next.js, `packages/shared` DTOs, `packages/database` Prisma schema)
**Performance Goals**: Panel carga en < 1s (SC-001); historial 12 meses sin degradación (SC-004)
**Constraints**: No modificar tablas existentes; extensión modular únicamente; patrón fire-and-forget para generación de notificaciones
**Scale/Scope**: ~100 usuarios activos, ~50 notificaciones/día estimadas, historial de 12 meses (~18.000 registros máximo)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Data-First**: Las dos nuevas tablas están definidas en `data-model.md` antes de cualquier implementación. No se modifican tablas existentes; solo se añaden back-relations de Prisma (metadata, sin campo físico). Compatible con Spec 002.
- [x] **Mobile-First**: El `NotificacionesButton` se integra en el AppBar (visible en todas las pantallas, incluyendo móvil). El panel usa `Drawer` en mobile y `Popover` en desktop (patrón MUI responsivo).
- [x] **Modular**: Nuevo módulo `notificaciones` completamente independiente. La integración en servicios existentes es mínima (una llamada fire-and-forget añadida al final de cada método disparo). No se modifica lógica de negocio existente.
- [x] **Audit**: Las notificaciones son un feed de actividad para usuarios finales, complementario (no sustituto) al `logs_auditoria`. Las acciones que disparan notificaciones ya están auditadas en `logs_auditoria`. Este feature no requiere auditarse a sí mismo.
- [x] **Sessions**: No aplica directamente. El pase de lista (`bulkUpsert`) ya está vinculado a `sesiones` por el modelo existente; la notificación referencia `clase_id`, no `sesion_id`, para contexto legible.

## Project Structure

### Documentation (this feature)

```text
specs/030-activity-notifications/
├── plan.md              ✅ Este archivo
├── research.md          ✅ Phase 0 — decisiones de diseño
├── data-model.md        ✅ Phase 1 — dos nuevas tablas + Prisma schema
├── quickstart.md        ✅ Phase 1 — guía de implementación
├── contracts/
│   └── api-notificaciones.md  ✅ Phase 1 — contrato API REST
└── tasks.md             🔲 Phase 2 — generado por /speckit.tasks
```

### Source Code (repository root)

```text
packages/database/
└── schema.prisma                     ← añadir 2 modelos + back-relations

packages/shared/src/schemas/
└── notificacion.schema.ts            ← nuevo: payloads + response DTOs

apps/api/src/
└── notificaciones/
    ├── notificaciones.module.ts      ← nuevo módulo NestJS
    ├── notificaciones.service.ts     ← lógica: registrar, getRecientes, historial, marcarLeidas
    └── notificaciones.controller.ts  ← GET /notificaciones, GET /notificaciones/historial, PUT /marcar-leidas

apps/api/src/sesiones/
└── asistencias.service.ts            ← modificar: inyectar NotificacionesService, llamada en bulkUpsert()

apps/api/src/inscripciones/
└── inscripciones.service.ts          ← modificar: inyectar NotificacionesService, llamada en registrarBaja()

apps/api/src/users/
└── users.service.ts                  ← modificar: inyectar NotificacionesService, llamada en promote()

apps/web/src/components/layout/
└── NotificacionesButton.tsx          ← nuevo: Bell + Badge + Popover/Drawer

apps/web/src/app/(admin)/layout.tsx   ← modificar: añadir NotificacionesButton en Toolbar

apps/web/src/app/(admin)/admin/
└── notificaciones/
    └── page.tsx                      ← nueva: tabla historial + filtros + paginación
```

**Structure Decision**: Estructura de web application (monorepo con `apps/api` y `apps/web`). Se utiliza el patrón establecido del proyecto: módulo NestJS independiente con servicio + controlador, inyectado en servicios existentes siguiendo el patrón de `AuditoriaService`. Frontend en Next.js App Router bajo el route group `(admin)`.

## Complexity Tracking

> No hay violaciones de la Constitución que justificar. El diseño es una extensión limpia.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

---

## Phase 0 Output

Ver `research.md` para las 5 decisiones documentadas:
1. Nueva tabla `notificaciones_actividad` vs. reutilizar `logs_auditoria`
2. Timestamp por usuario (`notificaciones_ultima_vista`) vs. tabla de unión
3. Generación sincrónica fire-and-forget (patrón AuditoriaService)
4. Nuevo módulo NestJS con inyección en servicios existentes
5. `NotificacionesButton` en AppBar con Popover/Drawer responsive

## Phase 1 Output

- `data-model.md` — Esquema Prisma de las dos nuevas tablas, relaciones, índices, constraints, descripciones generadas por tipo
- `contracts/api-notificaciones.md` — Contrato completo: 3 endpoints REST + tipos internos `NotificacionPayload` por tipo de acción
- `quickstart.md` — Secuencia de implementación en 4 pasos: DB → API → Shared → Frontend
