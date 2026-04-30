# Tareas: Gestión de Aulas — 010

**Entrada**: Documentos de diseño de `/specs/010-gestion-aulas/`
**Prerrequisitos**: spec.md | **Depende de**: spec 001 (AuthModule), spec 002 (tabla `aulas`)

## Formato: `- [ ] [ID] [P?] [Story?] Descripción con ruta de archivo`

---

## Fase 1: Setup

- [x] T001 Crear `AulasModule` en `apps/api/src/aulas/aulas.module.ts` con imports de PrismaModule y AuthModule
- [x] T002 [P] Crear esquemas Zod en `packages/shared/src/schemas/aula.schema.ts`: `CreateAulaSchema` (nombre: string único, capacidad: number opcional, ubicacion: string opcional), `UpdateAulaSchema`

---

## Fase 2: Fundacional

- [x] T003 Verificar existencia de tabla `aulas` en `packages/database/schema.prisma` con `nombre UNIQUE NOT NULL`, `capacidad`, `ubicacion`
- [x] T004 Implementar `AulasService` en `apps/api/src/aulas/aulas.service.ts`: `findAll()`, `findOne()`, `create()`, `update()`, `delete()`

**Punto de control**: Servicio base listo.

---

## Fase 3: Historia de Usuario 1 — CRUD de Aulas (P1) 🎯 MVP

**Objetivo**: El Escolástico puede registrar y gestionar el catálogo de aulas. Las aulas con horarios activos vinculados no pueden eliminarse.

**Prueba Independiente**: Crear aula → aparece en listado. Validación de nombre único en tiempo real (< 200ms). Intentar eliminar aula con horario activo → error 409 con mensaje descriptivo.

### Implementación — Historia de Usuario 1

- [x] T005 [US1] Implementar `GET /aulas` en `apps/api/src/aulas/aulas.controller.ts`: lista todas las aulas ordenadas por nombre
- [x] T006 [P] [US1] Implementar `POST /aulas` (solo Escolastico): crea aula con validación de unicidad de nombre (case-insensitive)
- [x] T007 [P] [US1] Implementar `GET /aulas/:id`: detalle de aula con conteo de horarios activos vinculados
- [x] T008 [P] [US1] Implementar `PATCH /aulas/:id` (solo Escolastico): actualiza nombre, capacidad o ubicación; re-valida unicidad de nombre
- [x] T009 [US1] Implementar `DELETE /aulas/:id` (solo Escolastico): bloquea eliminación si existe al menos un `horario` activo vinculado (FR-005); elimina físicamente si no hay dependencias
- [x] T010 [US1] Crear página de gestión de aulas en `apps/web/src/app/(admin)/aulas/page.tsx`: tabla MUI con columnas Nombre, Capacidad, Ubicación, Horarios Activos + botones Editar/Eliminar. Formulario inline o modal para crear/editar
- [x] T011 [US1] Agregar logs de auditoría en `AulasService` para creación, modificación y eliminación

**Punto de control**: US1 funcional — catálogo de aulas disponible para selección en horarios (spec 004 T028).

---

## Fase 4: Pulido

- [x] T012 [P] Documentar endpoints de `AulasController` con decoradores Swagger
- [x] T013 Validar SC-001 (catálogo disponible en 100% de formularios de horarios), SC-002 (validación < 200ms) según `spec.md`

---

## Dependencias

```
spec 002 (tabla aulas)
  └── Fase 1–2
        └── Fase 3 (US1) 🎯 MVP
```
- spec 004 T028 consume `GET /aulas` → T005 debe estar completo antes de crear horarios

## Alcance MVP
Fase completa (US1 es el único user story): CRUD de aulas con validación de dependencias.
