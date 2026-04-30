# Tareas: Usuarios (Roles y Privilegios) — 003

**Entrada**: Documentos de diseño de `/specs/003-roles/`
**Prerrequisitos**: spec.md | **Depende de**: spec 000 (monorepo), spec 001 (AuthModule/JWT), spec 002 (tablas `roles` y `usuarios` migradas)

## Formato: `- [ ] [ID] [P?] [Story?] Descripción con ruta de archivo`

- **[P]**: Puede ejecutarse en paralelo (archivos diferentes, sin dependencias entre sí)
- **[Story]**: Historia de usuario a la que pertenece la tarea

---

## Fase 1: Setup (Infraestructura del Módulo)

- [x] T001 Crear `UsersModule` en `apps/api/src/users/users.module.ts` con imports de PrismaModule y AuthModule
- [x] T002 [P] Crear esquemas Zod para operaciones de usuario en `packages/shared/src/schemas/user.schema.ts`: `CreateUserSchema`, `UpdateUserSchema`, `AssignRoleSchema`, `ChangePasswordSchema`
- [x] T003 [P] Crear `RolesGuard` (guard de Nest.js basado en decorador `@Roles()`) en `apps/api/src/common/guards/roles.guard.ts`
- [x] T004 [P] Crear decorador `@Roles(...roles)` en `apps/api/src/common/decorators/roles.decorator.ts`

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**⚠️ CRÍTICO**: No puede comenzar el trabajo en historias de usuario hasta que esta fase esté completa.

- [x] T005 Verificar que las tablas `roles` y `usuarios` existen en `packages/database/schema.prisma` con los 5 roles canónicos seed (`Escolastico`, `Instructor`, `Miembro`, `Probacionista`, `Ex-miembro`)
- [x] T006 Implementar `UsersService` con métodos base en `apps/api/src/users/users.service.ts`: `findAll()`, `findOne()`, `create()`, `update()`, `softDelete()`
- [x] T007 Registrar `RolesGuard` como guard global en `apps/api/src/app.module.ts`

**Punto de control**: Módulo base listo — las historias de usuario pueden comenzar.

---

## Fase 3: Historia de Usuario 1 — Gestión de Roles por Escolástico (P1) 🎯 MVP

**Objetivo**: El Escolástico puede crear usuarios, asignar roles, promover Probacionistas a Miembros y desactivar usuarios con lógica de soft delete.

**Prueba Independiente**: Crear un usuario Probacionista desde el panel, promoverlo a Miembro y verificar que sus credenciales llegan y puede hacer login. Intentar desactivar un Instructor con clases activas y verificar el bloqueo.

### Implementación — Historia de Usuario 1

- [x] T008 [US1] Implementar `GET /users` en `apps/api/src/users/users.controller.ts`: lista paginada con filtros por `rol`, `estado` y búsqueda por nombre/email
- [x] T009 [P] [US1] Implementar `POST /users` en `apps/api/src/users/users.controller.ts`: solo rol `Escolastico`, crea usuario con rol inicial `Probacionista`
- [x] T010 [P] [US1] Implementar `GET /users/:id` con detalle completo de perfil (solo `Escolastico` o el propio usuario)
- [x] T011 [US1] Implementar `PATCH /users/:id` (solo `Escolastico`): actualiza perfil con validación de unicidad de `email` y `ci` (FR-019, FR-020)
- [x] T012 [US1] Implementar `PATCH /users/:id/role` en `apps/api/src/users/users.controller.ts`: asigna o cambia rol. Validación: bloquear si rol `Instructor` tiene `clases` activas (FR-006)
- [x] T013 [P] [US1] Implementar `PATCH /users/:id/deactivate` (soft delete): setea `estado = 'Inactivo'`. Bloquear si tiene clases activas como Instructor
- [x] T014 [P] [US1] Implementar `GET /users/pending-approval` (Bandeja de Aprobación): lista usuarios con `rol = 'Probacionista'` ordenados por `created_at`
- [x] T015 [US1] Implementar `POST /users/:id/promote` en `apps/api/src/users/users.controller.ts`: cambia rol de `Probacionista` → `Miembro` y dispara envío de credenciales por email
- [x] T016 [P] [US1] Implementar `PATCH /users/me/password` (cualquier usuario autenticado): cambia propia contraseña validando la actual (FR-009)
- [x] T017 [US1] Crear página de listado de usuarios en `apps/web/src/app/(admin)/admin/users/page.tsx`: tabla MUI con filtros por rol y estado, búsqueda, paginación
- [x] T018 [P] [US1] Crear formulario de creación/edición de usuario en `apps/web/src/app/(admin)/admin/users/[id]/page.tsx`: React Hook Form + Zod, todos los campos del diccionario de datos
- [x] T019 [P] [US1] Crear página Bandeja de Aprobación en `apps/web/src/app/(admin)/admin/users/pending/page.tsx`: lista de Probacionistas con botón "Promover a Miembro"
- [x] T020 [US1] Agregar logs de auditoría (spec 012) en `UsersService` para: creación de usuario, cambio de rol, desactivación y promoción

**Punto de control**: US1 funcional — gestión completa del ciclo de vida de usuarios desde el panel Escolástico.

---

## Fase 4: Historia de Usuario 2 — Inscripción Universal (P1)

**Objetivo**: Exponer la lógica de elegibilidad para que cualquier Miembro/Instructor/Escolástico pueda ser inscrito como alumno. Bloquear auto-inscripción de Instructores en sus propias clases.

**Prueba Independiente**: Invocar `UsersService.getEligibleStudents(claseId)` y verificar que retorna todos los usuarios no-Probacionistas excluyendo al instructor titular de esa clase.

### Implementación — Historia de Usuario 2

- [x] T021 [US2] Implementar método `getEligibleStudents(claseId: string)` en `UsersService`: retorna usuarios con `estado = 'Activo'` y `rol != 'Probacionista'`, excluye al instructor titular de la clase (FR-002, FR-003 de spec 003)
- [x] T022 [P] [US2] Implementar `GET /users/eligible-students?claseId=:id` en `UsersController`: endpoint para que spec 007 (Inscripciones) consulte candidatos a alumno
- [x] T023 [US2] Agregar validación en `UsersService`: lanzar excepción si se intenta inscribir a un usuario como alumno en una clase donde es titular (guard reutilizable por spec 007)

**Punto de control**: US2 funcional — lógica de elegibilidad exportable a spec 007.

---

## Fase 5: Historia de Usuario 3 — Restricción de Docencia (P1)

**Objetivo**: Solo usuarios con rol `Instructor` pueden ser asignados como docentes de una clase. Exponer el endpoint de filtro para uso en spec 004.

**Prueba Independiente**: Invocar `GET /users/eligible-instructors` y verificar que solo retorna usuarios con `rol = 'Instructor'` y `estado = 'Activo'`.

### Implementación — Historia de Usuario 3

- [x] T024 [US3] Implementar método `getEligibleInstructors()` en `UsersService`: retorna solo usuarios con `rol = 'Instructor'` y `estado = 'Activo'` (FR-003)
- [x] T025 [P] [US3] Implementar `GET /users/eligible-instructors` en `UsersController`: endpoint reutilizado por spec 004 (Gestión de Materias) para selección de docente
- [x] T026 [US3] Agregar validación en `UsersService.assignInstructor()`: lanzar excepción si el usuario asignado no tiene rol `Instructor` (guard reutilizable por spec 004)

---

## Fase 5b: Historia de Usuario 5 — Seguimiento de Entrevista en Bandeja de Aprobación (P1)

**Objetivo**: El Escolástico puede registrar y actualizar la fecha de entrevista y el estado de completado de un Probacionista, pero solo desde la Bandeja de Aprobación.

**Prueba Independiente**: Desde la Bandeja de Aprobación, registrar `fecha_entrevista` y marcar `entrevista_completada = true` para un Probacionista. Verificar que el campo no aparece en el formulario general de edición del usuario.

### Implementación — Historia de Usuario 5

- [x] T032 [US5] Agregar columnas `fecha_entrevista` (Date, nullable) y `entrevista_completada` (Boolean, default false) al modelo `usuarios` en `packages/database/schema.prisma`
- [x] T033 [US5] Crear y aplicar migración de Prisma para los nuevos campos en `packages/database/`
- [x] T034 [P] [US5] Agregar campos `fecha_entrevista` y `entrevista_completada` al esquema Zod `UpdateUserSchema` en `packages/shared/src/schemas/user.schema.ts` con un sub-schema específico `UpdateInterviewSchema`
- [x] T035 [P] [US5] Implementar endpoint `PATCH /users/:id/interview` en `apps/api/src/users/users.controller.ts`: solo rol `Escolastico`, actualiza `fecha_entrevista` y `entrevista_completada`
- [x] T036 [US5] Implementar método `updateInterview(actorId, id, data)` en `apps/api/src/users/users.service.ts`: valida que el usuario sea Probacionista, registra log de auditoría
- [x] T037 [US5] Actualizar la página Bandeja de Aprobación en `apps/web/src/app/(admin)/admin/users/pending/page.tsx`: agregar formulario inline de entrevista (fecha + checkbox completado) por Probacionista
- [x] T038 [P] [US5] Verificar que el formulario de edición general `apps/web/src/app/(admin)/admin/users/[id]/page.tsx` NO expone los campos `fecha_entrevista` ni `entrevista_completada`

**Punto de control**: US5 funcional — seguimiento de entrevista disponible solo en Bandeja de Aprobación.

**Punto de control**: US3 funcional — filtros de docentes disponibles para spec 004.

---

## Fase 6: Historia de Usuario 4 — Versatilidad del Escolástico (P2)

**Objetivo**: Verificar que el guard de roles suma privilegios en lugar de restarlos — un Escolástico que también es alumno o instructor mantiene acceso total al panel administrativo.

**Prueba Independiente**: Autenticarse como usuario con rol `Escolastico`, inscribirlo en una clase como alumno y verificar que sigue accediendo a `/admin/users` sin restricciones.

### Implementación — Historia de Usuario 4

- [x] T027 [US4] Actualizar `RolesGuard` para soportar evaluación aditiva: si el usuario tiene rol `Escolastico`, conceder acceso sin importar otros roles o asignaciones (FR-005)
- [x] T028 [P] [US4] Agregar caso de prueba en la suite de `RolesGuard`: usuario con múltiples roles acumula permisos (no los pierde)

**Punto de control**: US4 funcional — acceso simultáneo como admin, instructor y alumno validado.

---

## Fase 7: Pulido y Temas Transversales

- [x] T029 [P] Documentar todos los endpoints de `UsersController` con decoradores Swagger (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`) en `apps/api/src/users/users.controller.ts`
- [x] T030 [P] Crear página de cambio de contraseña propia del usuario en `apps/web/src/app/(admin)/admin/profile/page.tsx`
- [x] T031 Ejecutar validación del flujo completo según los criterios de `spec.md`: SC-002 al SC-013

---

## Dependencias entre Fases

```
Fase 1 (Setup)
  └── Fase 2 (Fundacional)
        ├── Fase 3 (US1 — Gestión de Roles) 🎯 MVP
        │     └── Fase 4 (US2 — Inscripción Universal) [USA salida de US1]
        │     └── Fase 5 (US3 — Restricción de Docencia) [USA salida de US1]
        │           └── Fase 6 (US4 — Versatilidad) [REQUIERE US1 + US3]
        └── Fase 7 (Pulido)
```

- **Spec 004** (Gestión de Materias) depende de: T024, T025, T026 (US3 completo)
- **Spec 007** (Inscripciones) depende de: T021, T022, T023 (US2 completo)
- **Spec 001** (AuthModule) es prerrequisito de todas las fases (JWT guard)

---

## Oportunidades de Paralelismo (por fase)

| Fase | Tareas paralelas |
|------|-----------------|
| Fase 1 | T002, T003, T004 — esquemas Zod y guards independientes |
| Fase 3 | T009+T010, T013+T014 — endpoints backend y páginas frontend |
| Fase 3 | T017, T018, T019 — páginas frontend entre sí |
| Fase 4 | T022 frontend, T023 validación — independientes |
| Fase 5 | T025, T026 — endpoint y validación independientes |

---

## Alcance MVP sugerido

Implementar solo **Fase 1 + Fase 2 + Fase 3 (US1)** para el MVP operativo:
- Crear/gestionar usuarios con roles
- Bandeja de aprobación de Probacionistas
- Soft delete con validación de clases activas

Las fases 4–6 pueden diferirse hasta que specs 004 y 007 estén en desarrollo activo.
