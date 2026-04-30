# Tareas: Temas por Materia (Pensum) — 008-temas

**Entrada**: Documentos de diseño de `/specs/008-temas-por-materia/`
**Prerrequisitos**: spec.md | **Depende de**: spec 001 (AuthModule), spec 002 (tabla `temas`), spec 004 T010 (materia existente)

## Formato: `- [ ] [ID] [P?] [Story?] Descripción con ruta de archivo`

---

## Fase 1: Setup

- [X] T001 Crear `TemasModule` en `apps/api/src/temas/temas.module.ts` con imports de PrismaModule y AuthModule
- [X] T002 [P] Crear esquemas Zod en `packages/shared/src/schemas/tema.schema.ts`: `CreateTemaSchema` (materia_id, titulo, descripcion, orden), `UpdateTemaSchema`, `ReorderTemasSchema` (array de `{ id, orden }`)

---

## Fase 2: Fundacional

- [X] T003 Verificar existencia de tabla `temas` en `packages/database/schema.prisma` con FK `materia_id` y campo `orden`
- [X] T004 Implementar `TemasService` en `apps/api/src/temas/temas.service.ts`: `findByMateria()`, `create()`, `update()`, `deactivate()`, `reorder()`

**Punto de control**: Servicio base listo.

---

## Fase 3: Historia de Usuario 1 — Definición de Temas por Materia (P1) 🎯 MVP

**Objetivo**: Se puede crear, editar y ordenar los temas de una materia. Los temas son recuperables en orden cronológico.

**Prueba Independiente**: Crear 3 temas para una materia con órdenes 1, 2, 3. `GET /materias/:id/temas` retorna array ordenado por `orden`. Desactivar un tema → persiste con `estado = 'Inactivo'` sin eliminar.

### Implementación — Historia de Usuario 1

- [X] T005 [US1] Implementar `GET /materias/:id/temas` en `apps/api/src/temas/temas.controller.ts`: lista temas activos ordenados por `orden`
- [X] T006 [P] [US1] Implementar `POST /materias/:id/temas` (solo Escolastico): crea tema con validación de `orden` único dentro de la materia; auto-asigna orden al final si no se especifica
- [X] T007 [P] [US1] Implementar `PATCH /temas/:id` (solo Escolastico): actualiza titulo, descripcion u orden
- [X] T008 [P] [US1] Implementar `PATCH /temas/:id/deactivate` (solo Escolastico): soft delete, setea `estado = 'Inactivo'`
- [X] T009 [US1] Agregar logs de auditoría en `TemasService` para creación, actualización y desactivación

**Punto de control**: US1 funcional — CRUD de temas con integridad de orden.

---

## Fase 4: Historia de Usuario 2 — Gestión de Contenido del Pensum (P2)

**Objetivo**: El Escolástico gestiona el programa de estudios desde la UI, incluyendo reordenación drag-and-drop.

**Prueba Independiente**: Desde el panel de materia, reordenar 3 temas vía drag-and-drop y verificar que `PATCH /temas/reorder` persiste el nuevo orden correctamente.

### Implementación — Historia de Usuario 2

- [X] T010 [US2] Implementar `PATCH /materias/:id/temas/reorder` en `TemasController`: acepta array `[{ id, orden }]` y actualiza en transacción Prisma
- [X] T011 [P] [US2] Crear sección de gestión de temas en `apps/web/src/app/(admin)/materias/[id]/page.tsx`: lista de temas con botones de edición inline, botón "Agregar Tema" y soporte de reordenación (MUI DnD o simple flechas arriba/abajo)

**Punto de control**: US2 funcional — pensum gestionable desde UI.

---

## Fase 5: Pulido

- [X] T012 [P] Documentar endpoints de `TemasController` con decoradores Swagger
- [ ] T013 Validar SC-001 (integridad FK materia_id), SC-003 (orden correcto en consulta) según `spec.md`

---

## Dependencias

```
spec 004 US1 (materias)
  └── Fase 1–2
        └── Fase 3 (US1) 🎯 MVP
              └── Fase 4 (US2)
```
- spec 009 (Temas por Clase) consume `GET /materias/:id/temas` → T005

## Alcance MVP
Fases 1–3 (US1): CRUD de temas con orden secuencial, prerequisito de spec 009.
