# Tareas: Registro de Asistencia — 005

**Entrada**: Documentos de diseño de `/specs/005-registro-asistencia/`
**Prerrequisitos**: plan.md | spec.md | data-model.md | contracts/ | research.md | quickstart.md
**Depende de**: spec 001 (AuthModule), spec 002 (tablas `sesiones`, `asistencias`), spec 004 (clases e inscripciones), spec 012 (AuditoriaModule)

## Formato: `- [x/·] [ID] [P?] [Story?] Descripción con ruta de archivo`

---

## Fase 1: Setup

- [x] T001 Crear `SesionesModule` en `apps/api/src/sesiones/sesiones.module.ts` con imports de PrismaModule, AuthModule y AuditoriaModule
- [x] T002 [P] Crear `CreateSesionSchema` en `packages/shared/src/schemas/sesion.schema.ts`: clase_id, fecha (opcional), tipo (opcional, default `'Clase'`), tema_id (opcional), comentarios (opcional)
- [x] T003 [P] Crear `BulkAsistenciaSchema` y `UpdateAsistenciaSchema` en `packages/shared/src/schemas/asistencia.schema.ts` con enum `EstadoAsistencia = 'Presente' | 'Ausente' | 'Licencia'`

**Punto de control**: Módulo y schemas listos.

---

## Fase 2: Fundacional

**⚠️ CRÍTICO**: No puede iniciarse ninguna historia de usuario hasta completar esta fase.

- [x] T004 Verificar tablas `sesiones` y `asistencias` en `packages/database/schema.prisma` — confirmar enums `TipoSesion` y `EstadoAsistencia`, constraint `@@unique([inscripcion_id, sesion_id])` en `asistencias`
- [x] T005 Implementar `SesionesService` en `apps/api/src/sesiones/sesiones.service.ts`: métodos `findByClase(claseId)`, `createSesion(dto)`, `getOrCreateToday(claseId)`, `findOne(sesionId)`
- [x] T006 [P] Implementar `AsistenciasService` en `apps/api/src/sesiones/asistencias.service.ts`: métodos `findBySesion(claseId, sesionId)`, `bulkUpsert(actorId, sesionId, dto)`, `updateOne(actorId, asistenciaId, dto)`, `calcularPorcentajePorAlumno(claseId)`

**Punto de control**: Servicios base listos.

---

## Fase 3: Historia de Usuario 1 — Registro Rápido de Asistencia — Instructor (P1) 🎯 MVP

**Objetivo**: Instructor abre app móvil, ve sus clases del día, selecciona una (o auto-navega si hay solo una), y registra asistencia con mínimos toques.

**Prueba Independiente**: Login como Instructor → `/asistencia` → si hay 1 clase, la apertura es automática → guardar asistencias bulk → verificar registros en `asistencias` con estado correcto y alumnos no marcados como `'Ausente'`.

### Backend — Historia de Usuario 1

- [x] T007 [US1] Implementar `GET /clases/hoy` en `apps/api/src/sesiones/sesiones.controller.ts`: Instructor recibe sus clases del día filtradas por `horario.dia_semana == hoy` e `instructor_id == userId`
- [x] T008 [US1] Implementar `POST /clases/:id/sesiones` (roles: Instructor, Escolástico): idempotente via `getOrCreateToday()` — retorna sesión existente del día o crea con tipo `'Clase'`
- [x] T009 [US1] Implementar `GET /clases/:id/sesiones/:sesionId/asistencias`: lista de inscritos activos con estado (default `'Ausente'` si no tiene registro) y `asistencia_id` nullable
- [x] T010 [US1] Implementar `POST /clases/:id/sesiones/:sesionId/asistencias/bulk`: upsert atómico — payload define estado para incluidos; no incluidos quedan `'Ausente'`
- [x] T011 [P] [US1] Implementar `PATCH /clases/:id/sesiones/:sesionId/asistencias/:asistenciaId`: actualiza estado individual + `AuditoriaService.log()` con valor anterior/nuevo

### Frontend Mobile — Historia de Usuario 1

- [x] T012 [P] [US1] Crear `apps/web/src/app/(instructor)/asistencia/page.tsx`: lista de clases del día con MUI Card; si el Instructor tiene exactamente 1 clase hoy, auto-crear sesión y navegar sin selección manual (FR-001)
- [x] T013 [US1] Crear `apps/web/src/app/(instructor)/asistencia/[claseId]/page.tsx`: pase de lista mobile-first con toggle 3 estados, "Todos Presentes", botón "Guardar" sticky; si no hay `sesionId` mostrar "Iniciar sesión de hoy"
- [x] T014 [P] [US1] Agregar audit log en `AsistenciasService.updateOne()` via `AuditoriaService.log({ accion: 'UPDATE', tabla_afectada: 'asistencias' })`

**Punto de control**: US1 funcional — pase de lista móvil en < 30 seg para 20 alumnos (SC-001).

---

## Fase 4: Historia de Usuario 1b — Escolástico en Cualquier Clase Activa (P1)

**Objetivo**: Escolástico accede al pase de lista de cualquier clase activa del sistema con los mismos permisos que el instructor titular.

**Prueba Independiente**: Login como Escolástico → abrir clase de otro instructor → registrar asistencias → verificar `logs_auditoria` con `usuario_id == escolastico_id`.

### Backend — Historia de Usuario 1b

- [x] T015 [US1b] Extender `findClasesHoy(userId, roles)` en `apps/api/src/sesiones/sesiones.service.ts`: `roles.includes('Escolastico')` → todas las clases `estado == 'Activa'` con `instructor` incluido; instructor → filtro original
- [x] T016 [US1b] Actualizar `GET /clases/hoy` en `apps/api/src/sesiones/sesiones.controller.ts` para pasar `req.user.roles` a `findClasesHoy()`

### Frontend Desktop — Historia de Usuario 1b (pre-US4)

- [x] T017 [P] [US1b] Crear `apps/web/src/app/(admin)/admin/asistencia/page.tsx`: lista de clases activas con nombre del instructor; clic crea sesión y navega a pase de lista *(reemplazado por T030 en US4)*
- [x] T018 [P] [US1b] Crear `apps/web/src/app/(admin)/admin/asistencia/[claseId]/page.tsx`: pase de lista con sidebar, header clase+materia+instructor, botón "Iniciar sesión de hoy" si no hay sesionId *(reemplazado por T031 en US4)*
- [x] T019 [US1b] Agregar botón "Pase de lista" en columna de acciones de `apps/web/src/app/(admin)/admin/clases/page.tsx`: solo para `estado == 'Activa'`, crea sesión y navega a `/admin/asistencia/:id?sesionId=...`

**Punto de control**: US1b funcional — Escolástico opera cualquier clase activa.

---

## Fase 5: Historia de Usuario 2 — Historial de Asistencias (P2)

**Objetivo**: Instructor o Escolástico consulta historial de asistencias por clase con resumen por alumno y porcentajes.

**Prueba Independiente**: Navegar a `/admin/clases/:id/asistencias` → verificar porcentajes matemáticamente correctos (presentes/total_sesiones × 100).

### Backend — Historia de Usuario 2

- [x] T020 [US2] Implementar `GET /clases/:id/asistencias/resumen`: retorna `{ inscripcion_id, usuario, total_sesiones, presentes, ausentes, licencias, porcentaje }` via `calcularPorcentajePorAlumno()`
- [x] T021 [P] [US2] Implementar `GET /clases/:id/sesiones` en `apps/api/src/sesiones/sesiones.controller.ts`: lista de sesiones con fecha, tipo, tema y `_count.asistencias`

### Frontend — Historia de Usuario 2

- [x] T022 [P] [US2] Crear `apps/web/src/app/(admin)/clases/[id]/asistencias/page.tsx`: tabla resumen de alumnos (nombre/presentes/ausentes/licencias/porcentaje) + línea de tiempo de sesiones

**Punto de control**: US2 funcional.

---

## Fase 6: Historia de Usuario 3 — Alumno Consulta sus Asistencias (P3)

**Objetivo**: Alumno ve su propio resumen de asistencias en el Kardex.

**Prueba Independiente**: Login como Alumno → `/admin/kardex` → porcentaje coincide con BD.

### Backend — Historia de Usuario 3

- [x] T023 [US3] Implementar `GET /users/me/asistencias?claseId=:id`: `{ inscripcion_id, clase, total_sesiones, presentes, ausentes, licencias, porcentaje }` para usuario autenticado

### Frontend — Historia de Usuario 3

- [x] T024 [P] [US3] Agregar sección "Mis Asistencias" en `apps/web/src/app/(app)/kardex/page.tsx` con porcentaje por inscripción activa

**Punto de control**: US3 funcional.

---

## Fase 7: Navegación — Sidebar (FR-008 / FR-009 / FR-010)

- [x] T025 Actualizar `apps/web/src/components/layout/Sidebar.tsx`: filtrado por rol, entradas "Pase de lista" y "Kardex", `component={Link}` para client-side navigation
- [x] T026 [P] Crear `apps/web/src/app/(admin)/admin/kardex/page.tsx`: re-exporta Kardex del usuario autenticado

---

## Fase 8: Historia de Usuario 4 — Gestión de Sesiones por Clase (P2)

**Objetivo**: Desde la lista de clases vigentes, al seleccionar una clase se muestra un hub de gestión de sesiones (historial cronológico + crear nueva + abrir existente con edición de asistencias y metadatos). El pase de lista muestra fecha y día de la semana en el header (FR-015, FR-016).

**Prueba Independiente**: Seleccionar clase → ver historial de sesiones → seleccionar sesión pasada → editar asistencia de un alumno y cambiar tipo de sesión → guardar → verificar cambios persistidos. Verificar que el header del pase de lista muestra la fecha completa y el día.

### Backend — Historia de Usuario 4

- [x] T027 [US4] Agregar `UpdateSesionSchema` en `packages/shared/src/schemas/sesion.schema.ts`: objeto con campos `tipo`, `tema_id`, `comentarios` todos opcionales; exportar `UpdateSesionDto`
- [x] T028 [US4] Agregar método `updateSesion(sesionId, dto)` en `apps/api/src/sesiones/sesiones.service.ts`: actualiza `tipo`, `tema_id`, `comentarios` de la sesión vía Prisma
- [x] T029 [US4] Agregar `PATCH /clases/:id/sesiones/:sesionId` en `apps/api/src/sesiones/sesiones.controller.ts` (roles: Instructor, Escolástico): recibe `UpdateSesionDto`, llama a `sesionesService.updateSesion()`

### Frontend — Historia de Usuario 4

- [x] T030 [US4] Actualizar `apps/web/src/app/(admin)/admin/asistencia/page.tsx`: cambiar `handleSelect` para navegar directamente a `/admin/asistencia/${claseId}` sin crear sesión primero (la creación de sesión se mueve al hub)
- [x] T031 [US4] Rediseñar `apps/web/src/app/(admin)/admin/asistencia/[claseId]/page.tsx` como hub de gestión de sesiones: carga `GET /clases/:id` para header (clase + materia + instructor), carga `GET /clases/:id/sesiones` para historial cronológico (fecha completa con día de la semana, tipo, chip de asistentes), botón prominente "Iniciar sesión de hoy" / "Continuar sesión de hoy" (detecta si ya existe sesión del día), cada ítem de historial navega a `/admin/asistencia/:claseId/sesiones/:sesionId`
- [x] T032 [US4] Crear `apps/web/src/app/(admin)/admin/asistencia/[claseId]/sesiones/[sesionId]/page.tsx`: pase de lista completo — header con fecha y día de la semana de la sesión (ej. "Miércoles 23 de Abril de 2026"), lista de alumnos con toggle 3 estados, botón "Todos Presentes", sección de metadatos de sesión (Select tipo: Clase/Examen/Practica/Repaso, TextField comentarios), botones "Guardar asistencias" y "Guardar cambios de sesión" independientes (FR-015, FR-016)
- [x] T033 [P] [US4] Actualizar header en `apps/web/src/app/(instructor)/asistencia/[claseId]/page.tsx`: mostrar fecha completa y día de la semana de la sesión activa en el subtitle del header (ej. "Jueves 24 de Abril de 2026") usando los datos de la sesión cargada (FR-015)

**Punto de control**: US4 funcional — hub de sesiones operativo con historial, edición de asistencias y metadatos.

---

## Fase 9: Pulido

- [x] T034 [P] Documentar endpoints de `SesionesController` con `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation` por endpoint
- [ ] T035 Validación manual SC-001: pase de lista de 20 alumnos desde móvil en < 30 seg (quickstart.md — Escenario 1)
- [ ] T036 Validación manual SC-003: tiempo de carga de lista de alumnos en móvil < 1 seg

---

## Dependencias

```
spec 004 (clases + inscripciones)
  └── Fase 1-2 (Setup + Fundacional)
        ├── Fase 3 (US1 — Instructor móvil) 🎯 MVP
        ├── Fase 4 (US1b — Escolástico)
        ├── Fase 5 (US2 — Historial estadístico)
        ├── Fase 6 (US3 — Kardex alumno)
        └── Fase 8 (US4 — Hub de sesiones)
              ├── T027-T029 (backend PATCH sesión) [paralelo a T030-T033]
              └── T030-T033 (frontend hub + pase de lista con fecha)
```

- spec 008 (Instructor Dashboard): consume `GET /clases/hoy` → T007
- spec 009 (Temas por Clase): comparte `SesionesModule` → T005
- spec 012 (Auditoría): dependencia de T011, T014

## Alcance MVP

Fases 1–3 (US1): pase de lista móvil operativo para Instructor.

## Estado de implementación

| Fase | Story | Tareas | Completas | Pendientes |
|------|-------|--------|-----------|------------|
| 1 Setup | — | 3 | 3 | 0 |
| 2 Fundacional | — | 3 | 3 | 0 |
| 3 US1 Instructor | US1 | 8 | 8 | 0 |
| 4 US1b Escolástico | US1b | 5 | 5 | 0 |
| 5 US2 Historial | US2 | 3 | 3 | 0 |
| 6 US3 Kardex | US3 | 2 | 2 | 0 |
| 7 Navegación | — | 2 | 2 | 0 |
| 8 US4 Hub sesiones | US4 | 7 | 7 | 0 |
| 9 Pulido | — | 3 | 1 | 2 |
| **Total** | | **36** | **34** | **2** |
