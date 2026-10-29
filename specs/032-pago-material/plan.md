# Implementation Plan: Registro de Pago por Material Entregado

**Branch**: `032-pago-material` | **Date**: 2026-10-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/032-pago-material/spec.md`

## Summary

Nueva opción **"Materiales"** en el menú lateral (Instructor y Escolástico): lista de clases vigentes (activas/finalizadas, con filtros de instructor y día) → **control de material de la clase**, una sola pantalla con la lista fija de inscritos. Cada alumno muestra su total pagado y el detalle de sus pagos; un botón **+** por fila abre un formulario corto (fecha hoy, monto, temas precargados del último pago, comentario) para registrar un pago nuevo, por ejemplo una segunda cuota del mismo material. Se agregan tres tablas nuevas como extensión modular (`material_clase` única por clase, `pagos_material`, `pago_material_temas`) que solo referencian tablas existentes, endpoints REST bajo `/clases/:id/material` (Next.js route handlers, con espejo en NestJS como en specs anteriores), validación compartida con Zod y auditoría en `logs_auditoria`.

## Technical Context

**Language/Version**: TypeScript 5.4
**Primary Dependencies**: Next.js 14 App Router + MUI v5 (frontend y route handlers en `apps/web/src/app/api`), NestJS 10 (`apps/api`, espejo), Prisma 5, Zod (`packages/shared`)
**Storage**: PostgreSQL vía Prisma — 3 tablas nuevas, sin cambios en tablas existentes; montos en `DECIMAL(8,1)`
**Testing**: No hay runner de tests configurado en el repo; validación con `tsc --noEmit` + escenarios manuales de `quickstart.md`
**Target Platform**: Web responsive mobile-first, deploy en Vercel (solo `apps/web`)
**Project Type**: Web application — Turborepo monorepo (`apps/web`, `apps/api`, `packages/shared`, `packages/database`)
**Performance Goals**: Cargar el control de material de una clase (20–40 inscritos, decenas de pagos) en < 1 s; registrar un pago en < 500 ms
**Constraints**: **Cero cambios sobre tablas y datos vigentes** — la migración solo puede contener `CREATE TABLE`, `CREATE INDEX` y `ADD CONSTRAINT` sobre las 3 tablas nuevas (ningún `ALTER`/`DROP`/`UPDATE`/`DELETE` sobre tablas existentes); el `migration.sql` se revisa antes de aplicarlo y se aplica solo con `prisma migrate deploy` (prohibido `db push`, `migrate reset` o `--accept-data-loss`); montos exactos sin errores de coma flotante; reutilizar patrones del pase de lista (UI, rutas, auditoría); sin dependencias nuevas
**Scale/Scope**: ~50 clases vigentes, ~20–40 inscritos por clase, pocos pagos por alumno; 2 pantallas nuevas + 1 diálogo + 1 componente extraído

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Data-First**: Se diseñan las 3 tablas nuevas antes de cualquier código (ver `data-model.md`) y se agregan al diccionario de datos (spec 002). Son una **extensión**: no alteran columnas ni relaciones existentes; solo agregan FKs hacia `clases`, `inscripciones`, `temas` y `usuarios`. ⚠️ Agregar tablas y ampliar el alcance del MVP requiere aprobación explícita según la Gobernanza — ver Complexity Tracking.
- [x] **Mobile-First**: Pantalla operacional: una fila por alumno con total y botón **+**; el alta de pago es un bottom sheet con monto (`inputMode="decimal"`), fecha y temas precargados; se guarda sin salir de la lista.
- [x] **Modular**: Rutas, páginas y tablas nuevas. Único cambio en código existente: extraer la lista de clases de `/admin/asistencia` a un componente reutilizable (evita duplicar filtros y carga) y agregar el ítem al `Sidebar`.
- [x] **Audit**: Alta, edición y eliminación de cada pago, y cambios del comentario de la cabecera, se registran en `logs_auditoria` vía `auditLog` con `valor_anterior`/`valor_nuevo` (spec 012).
- [x] **Sessions**: El registro académico no se toca. El material es **deliberadamente independiente** de las sesiones (FR-013): no crea ni requiere sesión.

**Post-design re-check (Phase 1)**: sin cambios — el diseño final mantiene las 5 casillas; la única observación sigue siendo la aprobación de las tablas nuevas.

## Project Structure

### Documentation (this feature)

```text
specs/032-pago-material/
├── plan.md              ✅ Este archivo
├── research.md          ✅ Phase 0 — decisiones de diseño
├── data-model.md        ✅ Phase 1 — 3 tablas nuevas + reglas de validación
├── quickstart.md        ✅ Phase 1 — guía de validación end-to-end
├── contracts/
│   └── api-material-clase.md  ✅ Phase 1 — endpoints REST
└── tasks.md             🔲 Phase 2 — generado por /speckit-tasks
```

### Source Code (repository root)

```text
packages/database/
├── schema.prisma                                   ← agregar modelos material_clase, pagos_material,
│                                                     pago_material_temas (+ relaciones inversas en
│                                                     clases, inscripciones, temas, usuarios — sin columnas)
└── migrations/20261028000000_material_clase/
    └── migration.sql                               ← nuevo (solo CREATE)

packages/shared/src/schemas/
└── material.schema.ts                              ← nuevo: MontoSchema, CreatePagoMaterialSchema,
                                                      UpdatePagoMaterialSchema, UpdateMaterialClaseSchema
                                                      (+ export en el index)

apps/web/src/app/api/clases/[id]/material/
├── route.ts                                        ← nuevo: GET lista fija + totales, PATCH cabecera
└── pagos/
    ├── route.ts                                    ← nuevo: POST pago (upsert de cabecera)
    └── [pagoId]/route.ts                           ← nuevo: PATCH, DELETE

apps/web/src/lib/
└── material-clase.ts                               ← nuevo: assertAccesoMaterial(), serialización de montos

apps/web/src/components/clases/
└── ClasesVigentesList.tsx                          ← nuevo: lista de clases extraída de /admin/asistencia
                                                      (filtros instructor/día/Finalizadas, prop hrefFor)

apps/web/src/app/(admin)/admin/asistencia/page.tsx  ← modificar: usar ClasesVigentesList (sin cambio funcional)
apps/web/src/app/(admin)/admin/materiales/
├── page.tsx                                        ← nuevo: lista de clases (ClasesVigentesList)
└── [claseId]/page.tsx                              ← nuevo: control de material (lista fija, totales, detalle)
apps/web/src/components/materiales/
└── PagoMaterialDialog.tsx                          ← nuevo: alta/edición de un pago (fecha, monto, temas, comentario)

apps/web/src/components/layout/Sidebar.tsx          ← modificar: ítem "Materiales" (Instructor, Escolastico)

apps/api/src/materiales/                            ← nuevo módulo espejo (paridad con route handlers)
├── materiales.module.ts
├── materiales.controller.ts
└── materiales.service.ts
apps/api/src/app.module.ts                          ← modificar: registrar MaterialesModule

specs/002-diccionario-datos/data-model.md           ← modificar: documentar las 3 tablas nuevas
```

**Structure Decision**: Extensión dentro del monorepo existente. El frontend consume `/api` (route handlers de Next.js, que es lo que se despliega en Vercel); el módulo NestJS se mantiene como espejo, igual que en specs 030/031. La lista de clases se extrae a un componente porque Materiales necesita exactamente la misma lista y filtros que Listas (Clean Code: sin lógica duplicada).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 3 tablas nuevas y funcionalidad fuera del alcance MVP original (Gobernanza: requiere aprobación explícita) | Registrar pagos múltiples por alumno con fecha, temas y comentario exige estructura propia | Reutilizar `sesiones`/`asistencias` mezclaría pagos con asistencia (rompe FR-013 y los % de asistencia); un JSON en una tabla existente no es consultable ni validable. **Estado: aprobado por VictorHugo1985 el 2026-10-29.** |
| Extraer `ClasesVigentesList` de `/admin/asistencia` (toca código existente) | Materiales usa la misma lista y filtros | Copiar la página duplicaría ~150 líneas de carga y filtros que ya cambiaron varias veces (día, finalizadas) |

---

## Phase 0 Output

Ver `research.md` — 10 decisiones:
1. Tablas propias vs. reutilizar sesiones/asistencias
2. Una cabecera por clase con pagos múltiples por alumno
3. Cabecera creada automáticamente con el primer pago
4. Tipo de dato del monto: `DECIMAL(8,1)`
5. Pago de 0 permitido
6. Operaciones por pago individual
7. Precarga de temas del último pago del alumno
8. Backend: route handlers de Next.js + espejo NestJS
9. Control de acceso: Instructor solo en sus clases; clases `Inactiva` excluidas
10. Reutilización de UI: componente de lista extraído + diálogo de pago

## Phase 1 Output

- `data-model.md` — `material_clase`, `pagos_material`, `pago_material_temas`; garantía de no modificación, reglas de validación y armado de la lista fija
- `contracts/api-material-clase.md` — 5 endpoints REST con request/response y errores
- `quickstart.md` — escenarios de validación de US1, US2, permisos y casos borde
