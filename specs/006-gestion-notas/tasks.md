# Tareas: Gestión de Notas y Kardex — 006

**Entrada**: Documentos de diseño de `/specs/006-gestion-notas/`
**Prerrequisitos**: spec.md | **Depende de**: spec 001 (AuthModule), spec 002 (tabla `notas`), spec 004 T031 (inscripciones activas)

## Formato: `- [ ] [ID] [P?] [Story?] Descripción con ruta de archivo`

---

## Fase 1: Setup

- [ ] T001 Crear `NotasModule` en `apps/api/src/notas/notas.module.ts` con imports de PrismaModule y AuthModule
- [ ] T002 [P] Crear esquemas Zod en `packages/shared/src/schemas/nota.schema.ts`: `CreateNotaSchema` (inscripcion_id, nota: Enum 'Sobresaliente'|'Repite'|'Aprobo', tipo_evaluacion), `UpdateNotaSchema`

---

## Fase 2: Fundacional

- [ ] T003 Verificar existencia de tabla `notas` en `packages/database/schema.prisma` con Enum `EstadoNota`: `'Sobresaliente'`, `'Repite'`, `'Aprobo'`
- [ ] T004 Implementar `NotasService` en `apps/api/src/notas/notas.service.ts`: `findByClase()`, `createNota()`, `updateNota()`, `closeClase()`, `getKardex(usuarioId)`

**Punto de control**: Servicio base listo.

---

## Fase 3: Historia de Usuario 1 — Registro de Notas por Clase (P1) 🎯 MVP

**Objetivo**: Instructor accede a la lista de inscritos de su clase y registra/edita la nota final para cada alumno desde el Enum predefinido.

**Prueba Independiente**: POST `/clases/:id/notas` con inscripcion_id y nota válida. Verificar que queda vinculado al instructor autenticado. Intentar ingresar valor fuera del Enum y verificar error 400.

### Implementación — Historia de Usuario 1

- [ ] T005 [US1] Implementar `GET /clases/:id/notas` en `apps/api/src/notas/notas.controller.ts`: retorna lista de inscritos con su nota actual (null si aún no registrada)
- [ ] T006 [US1] Implementar `POST /clases/:id/notas` (Instructor o Escolastico): crea nota vinculada a inscripcion_id, valida Enum y unicidad por tipo_evaluacion+inscripcion
- [ ] T007 [P] [US1] Implementar `PATCH /notas/:id` (Instructor titular o Escolastico): actualiza nota existente, bloqueado si clase está cerrada
- [ ] T008 [P] [US1] Implementar `POST /clases/:id/notas/close` (solo Escolastico): setea flag de cierre en la clase (campo `notas_cerradas: Boolean` en `clases`); después del cierre ningún instructor puede editar notas
- [ ] T009 [US1] Crear página de registro de notas en `apps/web/src/app/(instructor)/clases/[id]/notas/page.tsx`: tabla de alumnos inscritos con selector MUI de nota (Sobresaliente/Repite/Aprobo), botón guardar por fila
- [ ] T010 [US1] Agregar logs de auditoría (spec 012) en `NotasService` para creación y modificación de notas

**Punto de control**: US1 funcional — notas registrables y validadas por Enum.

---

## Fase 4: Historia de Usuario 2 — Kardex y Revisión Administrativa (P2)

**Objetivo**: Cualquier usuario autenticado puede ver su propio Kardex. El Escolástico puede ver el Kardex de cualquier alumno con herramientas de corrección.

**Prueba Independiente**: Login como alumno, acceder a `/kardex`, verificar que muestra todas las clases inscritas con nota, % de asistencia y estado. Login como Escolástico, buscar alumno y ver mismo Kardex con opción de edición.

### Implementación — Historia de Usuario 2

- [ ] T011 [US2] Implementar `GET /users/:id/kardex` en `apps/api/src/notas/notas.controller.ts`: agrega inscripciones del usuario con materia, nota, porcentaje de asistencia (de spec 005), estado de inscripción y flag `concluyo_temario_materia`
- [ ] T012 [P] [US2] Implementar `GET /users/me/kardex`: alias protegido para el usuario autenticado
- [ ] T013 [P] [US2] Crear página de Kardex propio en `apps/web/src/app/(app)/kardex/page.tsx`: tabla MUI con columnas Materia, Periodo (mes/año), Nota, % Asistencia, Estado — solo lectura
- [ ] T014 [P] [US2] Crear página de Kardex administrativo en `apps/web/src/app/(admin)/usuarios/[id]/kardex/page.tsx`: misma vista con botones de edición de nota (si clase no está cerrada)

**Punto de control**: US2 funcional — Kardex visible para alumno y Escolástico.

---

## Fase 5: Pulido

- [ ] T015 [P] Documentar endpoints de `NotasController` con decoradores Swagger
- [ ] T016 Validar SC-001 (Kardex 20 materias < 800ms), SC-004 (notas inválidas bloqueadas 100%) según `spec.md`

---

## Dependencias

```
spec 004 (inscripciones) + spec 005 (porcentaje asistencia)
  └── Fase 1–2
        └── Fase 3 (US1) 🎯 MVP
              └── Fase 4 (US2)
```
- spec 008 (Instructor Dashboard) consume `GET /clases/:id/notas` → T005
- spec 011 (Reportes) consume `GET /users/:id/kardex` → T011

## Alcance MVP
Fases 1–3 (US1): registro de notas desde el panel del instructor.
