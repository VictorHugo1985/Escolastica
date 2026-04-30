# Tareas: Seguimiento de Temas por Sesión — 009

**Entrada**: Documentos de diseño de `/specs/009-temas-por-clase/`
**Prerrequisitos**: spec.md | **Depende de**: spec 001 (AuthModule), spec 002 (tabla `sesiones` con campo `tema_id`), spec 005 T005 (SesionesService), spec 008-temas T005 (`GET /materias/:id/temas`)

**Nota de diseño**: Según clarificación 2026-04-21, `sesiones` reemplaza completamente a `clase_temas`. El seguimiento de temas se gestiona via el campo `tema_id` (FK → temas, Optional) en la tabla `sesiones`. No se crea tabla adicional.

## Formato: `- [ ] [ID] [P?] [Story?] Descripción con ruta de archivo`

---

## Fase 1: Setup

- [ ] T001 Verificar que `sesiones` en `packages/database/schema.prisma` incluye `tema_id String? @db.Uuid` con FK a `temas` y `comentarios String?`
- [ ] T002 [P] Extender esquema Zod existente en `packages/shared/src/schemas/sesion.schema.ts`: agregar `tema_id` (UUID opcional) y `comentarios` (string opcional) a `CreateSesionSchema` y `UpdateSesionSchema`

---

## Fase 2: Fundacional

- [ ] T003 Extender `SesionesService` en `apps/api/src/sesiones/sesiones.service.ts` con método `getAvanceClase(claseId)`: calcula `{ temas_totales, temas_avanzados, porcentaje }` comparando temas de la materia vs sesiones con `tema_id != null`
- [ ] T004 Agregar validación en `SesionesService.createSesion()` o `updateSesion()`: verificar que `tema_id` pertenece a la materia de la clase (integridad de materia, FR-005)

**Punto de control**: Validaciones de integridad listas.

---

## Fase 3: Historia de Usuario 1 — Registro de Avance de Tema (P1) 🎯 MVP

**Objetivo**: El instructor selecciona un tema del pensum al crear/editar una sesión, registrando el avance académico. Máximo un tema por clase por día.

**Prueba Independiente**: Crear sesión con `tema_id` → registrado correctamente. Intentar asignar `tema_id` de otra materia → error 422. Intentar crear segunda sesión para la misma clase en el mismo día → error 409.

### Implementación — Historia de Usuario 1

- [ ] T005 [US1] Extender `PATCH /clases/:id/sesiones/:sesionId` en `apps/api/src/sesiones/sesiones.controller.ts`: actualiza `tema_id` y `comentarios`. Valida que `tema_id` pertenece a la materia de la clase
- [ ] T006 [P] [US1] Implementar `GET /clases/:id/avance` en `SesionesController`: retorna `{ temas_totales, temas_avanzados, porcentaje, temas_pendientes[] }` usando `getAvanceClase()`
- [ ] T007 [US1] Agregar selector de tema en el formulario de creación/edición de sesión en `apps/web/src/app/(instructor)/asistencia/[claseId]/page.tsx`: dropdown con temas de la materia (cargado via `GET /materias/:id/temas`), marcando los ya avanzados

**Punto de control**: US1 funcional — instructor puede registrar el tema del día al tomar asistencia.

---

## Fase 4: Historia de Usuario 2 — Auditoría de Avance Académico (P2)

**Objetivo**: El Escolástico puede auditar el porcentaje de temas cubiertos en cualquier clase activa.

**Prueba Independiente**: `GET /clases/:id/avance` retorna porcentaje correcto. Vista del Escolástico muestra progreso de todas las clases activas con indicador visual de rezago.

### Implementación — Historia de Usuario 2

- [ ] T008 [US2] Crear página de auditoría de avance en `apps/web/src/app/(admin)/clases/[id]/avance/page.tsx`: barra de progreso MUI con temas avanzados (con fecha) y temas pendientes listados
- [ ] T009 [P] [US2] Agregar columna "Avance" con `LinearProgress` MUI en la tabla de clases activas `apps/web/src/app/(admin)/clases/page.tsx`

**Punto de control**: US2 funcional — Escolástico puede auditar rezago académico.

---

## Fase 5: Pulido

- [ ] T010 [P] Documentar nuevos campos y endpoint `GET /clases/:id/avance` con decoradores Swagger
- [ ] T011 Validar SC-002 (unicidad tema/día), SC-003 (consulta avance < 500ms) según `spec.md`

---

## Dependencias

```
spec 005 (SesionesService) + spec 008-temas (temas del pensum)
  └── Fase 1–2
        └── Fase 3 (US1) 🎯 MVP
              └── Fase 4 (US2)
```

## Alcance MVP
Fases 1–3 (US1): selector de tema integrado en el flujo de pase de lista.
