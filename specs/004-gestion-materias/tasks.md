# Tareas: Gestión de Materias y Clases — 004

**Entrada**: Documentos de diseño de `/specs/004-gestion-materias/`
**Prerrequisitos**: spec.md | **Depende de**: spec 000 (monorepo), spec 001 (AuthModule/JWT), spec 002 (tablas `materias`, `temas`, `clases`, `horarios`, `aulas`, `inscripciones`), spec 003 (T024–T026: `getEligibleInstructors`)

## Formato: `- [ ] [ID] [P?] [Story?] Descripción con ruta de archivo`

- **[P]**: Puede ejecutarse en paralelo (archivos diferentes, sin dependencias entre sí)
- **[Story]**: Historia de usuario a la que pertenece la tarea

---

## Fase 1: Setup (Infraestructura del Módulo)

- [ ] T001 Crear `MateriasModule` en `apps/api/src/materias/materias.module.ts` con imports de PrismaModule y AuthModule
- [ ] T002 Crear `ClasesModule` en `apps/api/src/clases/clases.module.ts` con imports de PrismaModule y AuthModule
- [ ] T003 [P] Crear esquemas Zod de materias en `packages/shared/src/schemas/materia.schema.ts`: `CreateMateriaSchema`, `UpdateMateriaSchema`
- [ ] T004 [P] Crear esquemas Zod de clases en `packages/shared/src/schemas/clase.schema.ts`: `CreateClaseSchema`, `UpdateClaseSchema`
- [ ] T005 [P] Crear esquemas Zod de horarios en `packages/shared/src/schemas/horario.schema.ts`: `CreateHorarioSchema`

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**⚠️ CRÍTICO**: No puede comenzar el trabajo en historias de usuario hasta que esta fase esté completa.

- [ ] T006 Verificar que las tablas `materias`, `temas`, `clases`, `horarios`, `aulas` existen en `packages/database/schema.prisma` (spec 002)
- [ ] T007 Implementar `MateriasService` con métodos base en `apps/api/src/materias/materias.service.ts`: `findAll()`, `findOne()`, `create()`, `update()`, `deactivate()`
- [ ] T008 Implementar `ClasesService` con métodos base en `apps/api/src/clases/clases.service.ts`: `findAll()`, `findOne()`, `create()`, `update()`, `changeStatus()`

**Punto de control**: Servicios base listos — las historias de usuario pueden comenzar.

---

## Fase 3: Historia de Usuario 1 — Crear y Gestionar Materias (P1) 🎯 MVP

**Objetivo**: El Escolástico puede crear, editar y desactivar materias (pensum). Cada materia tiene nombre, descripción, nivel académico y bandera de curso de probación.

**Prueba Independiente**: Crear una materia, editar su descripción, verificar que aparece en el listado filtrado por nombre. Desactivar la materia y verificar que su estado cambia a `'Inactivo'`.

### Implementación — Historia de Usuario 1

- [ ] T009 [US1] Implementar `GET /materias` en `apps/api/src/materias/materias.controller.ts`: lista paginada con filtros por `nombre`, `estado`, `es_curso_probacion` y `nivel`
- [ ] T010 [P] [US1] Implementar `POST /materias` (solo `Escolastico`): crea materia con validación de campos requeridos (`nombre`, `nivel`)
- [ ] T011 [P] [US1] Implementar `GET /materias/:id` con detalle completo incluido lista de temas asociados
- [ ] T012 [US1] Implementar `PATCH /materias/:id` (solo `Escolastico`): actualiza campos de materia
- [ ] T013 [P] [US1] Implementar `PATCH /materias/:id/deactivate` (solo `Escolastico`): setea `estado = 'Inactivo'`
- [ ] T014 [US1] Crear página de listado de materias en `apps/web/src/app/(admin)/materias/page.tsx`: tabla MUI con filtros por nombre y estado, columnas de nivel y tipo (probación/regular)
- [ ] T015 [P] [US1] Crear formulario de creación/edición de materia en `apps/web/src/app/(admin)/materias/[id]/page.tsx`: React Hook Form + Zod, campos nombre, descripción, nivel, es_curso_probacion
- [ ] T016 [US1] Agregar logs de auditoría (spec 012) en `MateriasService` para: creación, actualización y desactivación

**Punto de control**: US1 funcional — CRUD de materias operativo desde el panel Escolástico.

---

## Fase 4: Historia de Usuario 2 — Crear Clase y Asignar Instructor (P1)

**Objetivo**: El Escolástico abre una nueva instancia de clase vinculando una materia, un instructor y generando un código correlativo único (ej. `PSICOLOGIA-04-2026-A`).

**Prueba Independiente**: Crear una clase seleccionando materia e instructor. Verificar que el código se auto-genera con formato correcto, que el instructor es buscable solo entre usuarios con `rol = 'Instructor'` activo, y que la clase aparece en el listado.

### Implementación — Historia de Usuario 2

- [ ] T017 [US2] Implementar `GET /clases` en `apps/api/src/clases/clases.controller.ts`: lista con filtros por `materia_id`, `instructor_id`, `estado`, `anio_inicio`, `mes_inicio`
- [ ] T018 [US2] Implementar `POST /clases` (solo `Escolastico`): crea clase con validación de instructor elegible (consume `UsersService.getEligibleInstructors()` de spec 003 T024) y auto-genera `codigo` con formato `[MATERIA]-MM-YYYY[-PARALELO]`
- [ ] T019 [P] [US2] Implementar `GET /clases/:id` con detalle completo: materia, instructor, horarios e inscripciones
- [ ] T020 [P] [US2] Implementar `PATCH /clases/:id` (solo `Escolastico`): actualiza campos editables (celador, fecha_fin, estado)
- [ ] T021 [P] [US2] Implementar `PATCH /clases/:id/status` (solo `Escolastico`): cambia estado entre `'Activa'`, `'Inactiva'`, `'Finalizada'`
- [ ] T022 [US2] Crear página de listado de clases en `apps/web/src/app/(admin)/clases/page.tsx`: tabla MUI con filtros por materia, instructor, estado y anio_inicio/mes_inicio
- [ ] T023 [P] [US2] Crear formulario de creación de clase en `apps/web/src/app/(admin)/clases/new/page.tsx`: selector de materia (autocomplete MUI), selector de instructor (solo Instructores activos via `GET /users/eligible-instructors`), campos fecha_inicio, fecha_fin, celador, paralelo
- [ ] T024 [US2] Agregar logs de auditoría (spec 012) en `ClasesService` para: creación y cambio de estado de clase

**Punto de control**: US2 funcional — creación de clases con instructor asignado y código auto-generado.

---

## Fase 5: Historia de Usuario 3 — Gestión de Horarios (P2)

**Objetivo**: El Escolástico define uno o más bloques horarios semanales (día + hora + aula) para una clase. El sistema advierte sobre conflictos de aula sin bloquear el guardado (A-001 de spec 004).

**Prueba Independiente**: Agregar dos bloques horarios (Lunes 19:00–21:00 y Miércoles 19:00–21:00) a una clase. Intentar agregar un horario conflictivo en la misma aula y verificar que el sistema advierte pero permite guardar.

### Implementación — Historia de Usuario 3

- [ ] T025 [US3] Implementar `GET /clases/:id/horarios` en `apps/api/src/clases/clases.controller.ts`: lista todos los bloques horarios de una clase
- [ ] T026 [P] [US3] Implementar `POST /clases/:id/horarios`: agrega bloque horario con campos `dia_semana`, `hora_inicio`, `hora_fin`, `aula_id` (opcional). Incluye detección de conflicto de aula (mismo día/hora) como advertencia en la respuesta sin bloquear (HTTP 201 con `warnings[]`)
- [ ] T027 [P] [US3] Implementar `DELETE /clases/:id/horarios/:horarioId`: elimina bloque horario
- [ ] T028 [US3] Implementar `GET /aulas` en `apps/api/src/aulas/aulas.controller.ts`: lista de aulas disponibles para el selector del formulario (reutiliza datos de spec 010)
- [ ] T029 [P] [US3] Agregar sección de gestión de horarios en la página de detalle de clase `apps/web/src/app/(admin)/clases/[id]/page.tsx`: lista de bloques con botón de eliminación y formulario de adición (selector de día, timepicker MUI, selector de aula)

**Punto de control**: US3 funcional — horarios semanales configurables por clase con detección de conflictos.

---

## Fase 6: Historia de Usuario 4 — Inscripción de Miembros (P1)

**Objetivo**: El Escolástico inscribe miembros en una clase activa. El sistema impide duplicados e inscripciones en clases Finalizadas. Los Probacionistas solo pueden inscribirse en materias de probación (`es_curso_probacion = true`).

**Prueba Independiente**: Inscribir a un usuario en una clase activa y verificar estado `'Activo'`. Intentar inscribir al mismo usuario nuevamente y verificar error de duplicado. Intentar inscribir a un Probacionista en una materia regular y verificar bloqueo.

### Implementación — Historia de Usuario 4

- [ ] T030 [US4] Implementar `GET /clases/:id/inscripciones` en `apps/api/src/clases/clases.controller.ts`: lista de inscripciones activas con datos básicos del alumno
- [ ] T031 [US4] Implementar `POST /clases/:id/inscripciones` (solo `Escolastico`): crea inscripción con validaciones: (1) no duplicados, (2) clase no `Finalizada`, (3) Probacionistas solo en materias con `es_curso_probacion = true`, (4) instructor no se inscribe en su propia clase (spec 003 T023)
- [ ] T032 [P] [US4] Crear esquema Zod en `packages/shared/src/schemas/inscripcion.schema.ts`: `CreateInscripcionSchema`
- [ ] T033 [P] [US4] Agregar panel de inscripciones en `apps/web/src/app/(admin)/clases/[id]/page.tsx`: lista de alumnos inscritos con búsqueda de usuario (autocomplete `GET /users/eligible-students?claseId=:id` de spec 003 T022) y botón de inscribir
- [ ] T034 [US4] Agregar logs de auditoría (spec 012) en inscripción: registrar alta de alumno en `logs_auditoria`

**Punto de control**: US4 funcional — inscripción de alumnos con validaciones de rol y unicidad.

---

## Fase 7: Pulido y Temas Transversales

- [ ] T035 [P] Documentar todos los endpoints de `MateriasController` y `ClasesController` con decoradores Swagger en sus respectivos controllers
- [ ] T036 [P] Agregar endpoint `GET /materias/:id/temas` en `MateriasController` para listar temas del pensum de una materia (prerequisito de spec 008-temas-por-materia y spec 009)
- [ ] T037 Ejecutar validación de criterios de éxito SC-001 a SC-004 definidos en `spec.md`

---

## Dependencias entre Fases

```
Fase 1 (Setup)
  └── Fase 2 (Fundacional)
        ├── Fase 3 (US1 — CRUD Materias) 🎯 MVP
        │     └── Fase 4 (US2 — Crear Clase + Instructor) [REQUIERE US1: materia_id]
        │           ├── Fase 5 (US3 — Horarios) [REQUIERE US2: clase_id]
        │           └── Fase 6 (US4 — Inscripciones) [REQUIERE US2: clase_id]
        └── Fase 7 (Pulido)
```

**Dependencias externas:**
- T018 consume `UsersService.getEligibleInstructors()` → spec 003 T024–T026 deben estar completos
- T031 consume `UsersService.getEligibleStudents(claseId)` → spec 003 T021–T023 deben estar completos
- T028 (`GET /aulas`) → spec 010 (Gestión de Aulas) puede estar en paralelo pero el endpoint de aulas debe existir
- spec 005 (Asistencia), spec 006 (Notas), spec 007 (Inscripciones) dependen de: T018 (clase creada), T031 (inscripción base)

---

## Oportunidades de Paralelismo (por fase)

| Fase | Tareas paralelas |
|------|-----------------|
| Fase 1 | T003, T004, T005 — esquemas Zod independientes |
| Fase 3 | T010, T011, T013 — endpoints independientes; T014, T015 — páginas frontend |
| Fase 4 | T019, T020, T021 — endpoints de detalle/actualización; T022, T023 — páginas frontend |
| Fase 5 | T026, T027, T028 — endpoints independientes |
| Fase 6 | T032, T033 — schema y UI independientes del endpoint T031 |

---

## Alcance MVP sugerido

Implementar **Fase 1 + Fase 2 + Fase 3 (US1) + Fase 4 (US2)** para el MVP operativo:
- CRUD de materias del pensum
- Creación de clases con instructor asignado y código auto-generado

Fases 5 (horarios) y 6 (inscripciones básicas) pueden implementarse en paralelo una vez US2 esté completo, ya que son independientes entre sí.
