# Tareas: Movimientos de Inscripciones — 007

**Entrada**: Documentos de diseño de `/specs/007-inscripciones/`
**Prerrequisitos**: spec.md | **Depende de**: spec 001 (AuthModule), spec 002 (tabla `inscripciones`), spec 004 T031 (inscripciones base creadas)

## Formato: `- [ ] [ID] [P?] [Story?] Descripción con ruta de archivo`

---

## Fase 1: Setup

- [X] T001 Crear `InscripcionesModule` en `apps/api/src/inscripciones/inscripciones.module.ts` con imports de PrismaModule y AuthModule
- [X] T002 [P] Crear esquemas Zod en `packages/shared/src/schemas/inscripcion-movimiento.schema.ts`: `BajaSchema` (fecha_baja, motivo_baja: 'Ausencia'|'Trabajo'|'Personal'), `ConclusionSchema` (concluyo_temario_materia, fecha_conclusion_temario), `AprobacionSchema`

---

## Fase 2: Fundacional

- [X] T003 Verificar campos en `inscripciones` de `packages/database/schema.prisma`: `estado`, `fecha_baja`, `motivo_baja`, `concluyo_temario_materia`, `fecha_conclusion_temario`, `comentarios`
- [X] T004 Implementar `InscripcionesService` en `apps/api/src/inscripciones/inscripciones.service.ts`: `registrarBaja()`, `reactivar()`, `getHistorial()`, `marcarConclusion()`, `marcarAprobacion()`

**Punto de control**: Servicio base listo.

---

## Fase 3: Historia de Usuario 1 — Registrar Alta (P1) 🎯 MVP

**Objetivo**: El Escolástico da de alta a un alumno en una clase con estado 'Activo'. Si el alumno ya tuvo una baja previa en la misma clase se reactiva el registro existente.

**Prueba Independiente**: POST `/clases/:id/inscripciones` crea inscripción con estado `'Activo'`. Intentar alta duplicada → error 409. Dar de baja y volver a inscribir → reactiva registro anterior.

### Implementación — Historia de Usuario 1

- [X] T005 [US1] Implementar `POST /clases/:id/inscripciones` en `apps/api/src/inscripciones/inscripciones.controller.ts`: crea alta o reactiva baja previa. Bloquea si clase tiene `estado = 'Finalizada'`
- [X] T006 [US1] Agregar logs de auditoría (spec 012) en `InscripcionesService.registrarAlta()` para cada alta

**Punto de control**: US1 funcional — alta operativa con prevención de duplicados.

---

## Fase 4: Historia de Usuario 2 — Registrar Baja (P1)

**Objetivo**: El Escolástico da de baja a un alumno indicando motivo y fecha. El alumno desaparece de futuros pases de lista. Sus registros previos se preservan.

**Prueba Independiente**: PATCH baja en inscripción activa → estado `'Baja'`, fecha y motivo registrados. Verificar que `GET /clases/:id/sesiones/:sesionId/asistencias` (spec 005) excluye al alumno dado de baja.

### Implementación — Historia de Usuario 2

- [X] T007 [US2] Implementar `PATCH /inscripciones/:id/baja` (solo Escolastico): registra baja con validación de motivo obligatorio del Enum y fecha (permite fecha retroactiva con log de auditoría)
- [X] T008 [P] [US2] Actualizar `AsistenciasService` (spec 005) para excluir inscripciones con `estado != 'Activo'` al cargar pase de lista
- [X] T009 [P] [US2] Agregar logs de auditoría en `InscripcionesService.registrarBaja()` con valor anterior/nuevo en JSONB
- [X] T010 [US2] Agregar botón "Dar de Baja" en la lista de inscritos de la clase en `apps/web/src/app/(admin)/clases/[id]/page.tsx`: modal de confirmación con selector de motivo y campo de fecha

**Punto de control**: US2 funcional — bajas con historial preservado.

---

## Fase 5: Historia de Usuario 3 — Historial de Movimientos (P1)

**Objetivo**: El Escolástico puede consultar el historial completo de altas y bajas de un alumno o de una clase.

**Prueba Independiente**: GET historial de un alumno con múltiples movimientos → retorna tabla ordenada cronológicamente con materia, fecha_alta, fecha_baja y motivo_baja.

### Implementación — Historia de Usuario 3

- [X] T011 [US3] Implementar `GET /inscripciones?usuarioId=:id` (historial por alumno) en `InscripcionesController`: lista todas las inscripciones del usuario (activas, bajas, finalizadas) con datos de clase y materia
- [X] T012 [P] [US3] Implementar `GET /clases/:id/inscripciones/historial` (historial por clase): lista todos los movimientos de la clase incluyendo bajas con motivo
- [X] T013 [P] [US3] Crear página de historial de movimientos en `apps/web/src/app/(admin)/usuarios/[id]/movimientos/page.tsx`: tabla con columnas Materia, Clase, Fecha Alta, Fecha Baja, Motivo, Estado

**Punto de control**: US3 funcional — historial auditable de movimientos.

---

## Fase 6: Historia de Usuario 4 — Conclusión de Temario y Aprobación (P1)

**Objetivo**: El instructor titular o Escolástico marca individualmente si un alumno completó el temario de la materia y si aprobó la clase.

**Prueba Independiente**: PATCH conclusión en inscripción → `concluyo_temario_materia = true`, `fecha_conclusion_temario` registrada. Solo instructor titular o Escolástico puede ejecutarlo (spec 002 clarificación 2026-04-18).

### Implementación — Historia de Usuario 4

- [X] T014 [US4] Implementar `PATCH /inscripciones/:id/conclusion` (Instructor titular o Escolastico): actualiza `concluyo_temario_materia`, `fecha_conclusion_temario` y `comentarios`
- [X] T015 [P] [US4] Implementar validación en `InscripcionesService.marcarConclusion()`: verificar que el usuario autenticado es el instructor titular de la clase o tiene rol Escolastico
- [X] T016 [P] [US4] Agregar columna "Concluyó Temario" con toggle en la tabla de inscritos en `apps/web/src/app/(admin)/clases/[id]/page.tsx`

**Punto de control**: US4 funcional — conclusión de temario registrable por instructor titular.

---

## Fase 7: Pulido

- [X] T017 [P] Documentar endpoints de `InscripcionesController` con decoradores Swagger
- [ ] T018 Validar SC-001 (100% bajas con fecha+motivo), SC-004 (historial < 500ms) según `spec.md`

---

## Dependencias

```
spec 004 (inscripción base T031)
  └── Fase 1–2
        ├── Fase 3 (US1 — Alta) 🎯 MVP
        ├── Fase 4 (US2 — Baja)  [REQUIERE US1]
        ├── Fase 5 (US3 — Historial)
        └── Fase 6 (US4 — Conclusión) [REQUIERE US1]
```
- T008 modifica `AsistenciasService` de spec 005 — coordinar

## Alcance MVP
Fases 1–4 (US1+US2): ciclo alta-baja completo con historial preservado.
