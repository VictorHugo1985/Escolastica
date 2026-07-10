# Implementation Plan: Notificación de Clases sin Sesiones Recientes

**Branch**: `031-inactive-classes-alert` | **Date**: 2026-07-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/031-inactive-classes-alert/spec.md`

## Summary

Extender el sistema de notificaciones de actividad (Spec 030) con un nuevo tipo de notificación generada por el sistema: `clase_inactiva`. Lista las clases vigentes (estado `Activa`) cuya sesión registrada más reciente tiene 15 días o más de antigüedad (o que nunca registraron sesiones y comenzaron hace 15+ días). No se modifica el esquema de base de datos: se reutiliza la tabla `notificaciones_actividad` con un nuevo valor de `tipo`. La evaluación se ejecuta de forma perezosa (lazy) al consultar el panel de notificaciones, con deduplicación por día: se mantiene una única notificación agregada que se actualiza solo cuando cambia la lista de clases inactivas.

## Technical Context

**Language/Version**: TypeScript 5.4
**Primary Dependencies**: NestJS 10 (backend), Next.js 14 App Router + MUI v5 (frontend), Prisma 5 (ORM), Zod (validación compartida)
**Storage**: PostgreSQL vía Prisma — sin cambios de esquema (reutiliza `notificaciones_actividad`)
**Testing**: Vitest
**Target Platform**: Web (mobile-first responsive), deployed on Vercel
**Project Type**: Web application — Turborepo monorepo (`apps/api` NestJS, `apps/web` Next.js, `packages/shared` DTOs, `packages/database` Prisma schema)
**Performance Goals**: La evaluación de clases inactivas no debe degradar la carga del panel (< 1s, SC-001 de Spec 030); una consulta agregada sobre ~50 clases activas
**Constraints**: No modificar tablas existentes ni el módulo de notificaciones más allá de extensión; sin nuevas dependencias (no se agrega scheduler); patrón de deduplicación consistente con el pase de lista
**Scale/Scope**: ~50 clases activas, evaluación diaria efectiva, 1 notificación agregada por día como máximo

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Data-First**: Sin cambios de esquema. `notificaciones_actividad.tipo` es `VarChar(50)` sin constraint de enum en BD, por lo que el nuevo valor `clase_inactiva` es una extensión de datos compatible con Spec 002/003. La detección consulta tablas existentes (`clases`, `sesiones`) en solo lectura.
- [x] **Mobile-First**: Reutiliza el `NotificacionesButton` (Popover/Drawer responsive) y la página de historial existentes; solo se añade ícono y etiqueta del nuevo tipo.
- [x] **Modular**: Extensión del módulo `notificaciones` existente: un método nuevo de evaluación en `NotificacionesService` invocado desde `getRecientes`. No se toca lógica de negocio de clases ni sesiones.
- [x] **Audit**: La notificación es generada por el sistema (sin actor humano); no es una acción crítica de usuario, no requiere `logs_auditoria`. Las acciones correctivas que tome el usuario (bajas, etc.) ya están auditadas.
- [x] **Sessions**: La detección se basa directamente en el modelo de sesiones académicas: `MAX(sesiones.fecha)` por clase define la última actividad registrada, alineado con Spec 003.

## Project Structure

### Documentation (this feature)

```text
specs/031-inactive-classes-alert/
├── plan.md              ✅ Este archivo
├── research.md          ✅ Phase 0 — decisiones de diseño
├── data-model.md        ✅ Phase 1 — sin tablas nuevas; nuevo valor de tipo + consulta de detección
├── quickstart.md        ✅ Phase 1 — guía de implementación
├── contracts/
│   └── api-notificaciones-extension.md  ✅ Phase 1 — extensión del contrato de Spec 030
└── tasks.md             🔲 Phase 2 — generado por /speckit.tasks
```

### Source Code (repository root)

```text
packages/shared/src/schemas/
└── notificacion.schema.ts            ← modificar: añadir 'clase_inactiva' al enum TipoNotificacion
                                        y el payload ClaseInactivaPayload

apps/api/src/notificaciones/
├── notificaciones.service.ts         ← modificar: método evaluarClasesInactivas() +
│                                       invocación desde getRecientes() + buildDescripcion del nuevo tipo
└── notificaciones.controller.ts      ← modificar: añadir 'clase_inactiva' al enum del filtro de historial

apps/web/src/components/layout/
└── NotificacionesButton.tsx          ← modificar: ícono/etiqueta del nuevo tipo (actor null → "Sistema")

apps/web/src/app/(admin)/admin/notificaciones/
└── page.tsx                          ← modificar: opción de filtro "Clases inactivas" + ícono/etiqueta
```

**Structure Decision**: Extensión pura del módulo `notificaciones` de Spec 030 dentro del monorepo existente. No se crean módulos, tablas ni endpoints nuevos; el nuevo tipo viaja por los 3 endpoints REST ya publicados (`GET /notificaciones`, `GET /notificaciones/historial`, `PUT /notificaciones/marcar-leidas`).

## Complexity Tracking

> No hay violaciones de la Constitución que justificar. El diseño es una extensión de datos y lógica sin cambios estructurales.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

---

## Phase 0 Output

Ver `research.md` para las 5 decisiones documentadas:
1. Reutilizar `notificaciones_actividad` con nuevo `tipo` vs. tabla nueva
2. Evaluación perezosa (lazy) en `getRecientes` vs. cron/scheduler
3. Notificación agregada única por día, actualizada solo cuando cambia el contenido
4. Consulta de detección: `MAX(sesiones.fecha)` por clase activa con fallback a `fecha_inicio`
5. Notificación de sistema (actor null) y su representación en frontend

## Phase 1 Output

- `data-model.md` — Sin tablas nuevas; definición del nuevo valor de tipo, formato de descripción y consulta de detección
- `contracts/api-notificaciones-extension.md` — Extensión del contrato de Spec 030: nuevo valor de enum, payload interno y semántica de deduplicación
- `quickstart.md` — Secuencia de implementación en 3 pasos: Shared → API → Frontend
