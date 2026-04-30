# Tareas: Sistema de Auditoría y Trazabilidad — 012

**Entrada**: Documentos de diseño de `/specs/012-sistema-auditoria/`
**Prerrequisitos**: spec.md | **Depende de**: spec 001 (AuthModule), spec 002 (tabla `logs_auditoria`)

**Nota de diseño**: Este módulo es transversal. El servicio de auditoría (`AuditoriaService`) debe estar disponible antes de implementar cualquier operación de escritura en otros specs. Se recomienda implementar en paralelo con spec 003 o antes de él.

## Formato: `- [ ] [ID] [P?] [Story?] Descripción con ruta de archivo`

---

## Fase 1: Setup

- [x] T001 Crear `AuditoriaModule` en `apps/api/src/auditoria/auditoria.module.ts` exportando `AuditoriaService` como proveedor global
- [x] T002 [P] Definir tipo `AuditoriaPayload` en `packages/shared/src/types/auditoria.types.ts`: `{ usuario_id: string | null, accion: 'INSERT'|'UPDATE'|'DELETE', tabla_afectada: string, valor_anterior?: object, valor_nuevo?: object }`

---

## Fase 2: Fundacional

**⚠️ CRÍTICO**: `AuditoriaService` debe estar disponible antes de que otros módulos (003-012) registren sus logs.

- [x] T003 Verificar tabla `logs_auditoria` en `packages/database/schema.prisma`: `id`, `usuario_id` (nullable FK), `accion`, `tabla_afectada`, `valor_anterior JSONB`, `valor_nuevo JSONB`, `created_at`
- [x] T004 Implementar `AuditoriaService` en `apps/api/src/auditoria/auditoria.service.ts`: único método público `log(payload: AuditoriaPayload): Promise<void>`. Escritura async (no bloquea la transacción principal, SC-003 < 100ms adicional)
- [x] T005 Registrar `AuditoriaModule` como global en `apps/api/src/app.module.ts` para que todos los módulos puedan inyectar `AuditoriaService` sin declararlo en sus propios imports

**Punto de control**: `AuditoriaService` disponible para inyección en todos los módulos.

---

## Fase 3: Historia de Usuario 1 — Registro Automático de Acciones (P1) 🎯 MVP

**Objetivo**: Cada operación crítica (INSERT/UPDATE/DELETE) en las tablas auditadas queda registrada en `logs_auditoria` con usuario, tabla, acción y valores anterior/nuevo en JSONB.

**Tablas auditadas** (FR-001): `usuarios`, `roles`, `materias`, `clases`, `sesiones`, `inscripciones`, `asistencias`, `notas`.

**Prueba Independiente**: Actualizar el estado de un alumno, luego `SELECT * FROM logs_auditoria WHERE tabla_afectada = 'inscripciones' ORDER BY created_at DESC LIMIT 1` → retorna registro con `valor_anterior` y `valor_nuevo` en JSON válido.

### Implementación — Historia de Usuario 1

- [x] T006 [US1] Inyectar `AuditoriaService` en `UsersService` (spec 003) y agregar llamada `auditoria.log()` en: creación de usuario, cambio de rol, desactivación y promoción de Probacionista
- [x] T007 [P] [US1] Inyectar `AuditoriaService` en `MateriasService` y `ClasesService` (spec 004): registrar INSERT/UPDATE/DELETE en `materias` y `clases`
- [x] T008 [P] [US1] Inyectar `AuditoriaService` en `SesionesService` y `AsistenciasService` (spec 005): registrar cambios en `sesiones` y `asistencias` (especialmente correcciones de asistencias pasadas)
- [ ] T009 [P] [US1] Inyectar `AuditoriaService` en `NotasService` (spec 006): registrar creación y modificación de notas
- [ ] T010 [P] [US1] Inyectar `AuditoriaService` en `InscripcionesService` (spec 007): registrar altas, bajas y cambios de estado
- [x] T011 [US1] Verificar que los logs son inmutables: no exponer endpoints de UPDATE/DELETE en `AuditoriaController`. Sólo INSERT vía `AuditoriaService.log()`

**Punto de control**: US1 funcional — 100% de acciones críticas registradas automáticamente.

---

## Fase 4: Historia de Usuario 2 — Consulta de Logs de Auditoría (P2)

**Objetivo**: El Escolástico puede filtrar y consultar el historial de cambios por tabla, usuario, acción y rango de fechas.

**Prueba Independiente**: `GET /audit-logs?tabla=notas&usuarioId=:id&fechaDesde=:d` retorna lista cronológica de cambios filtrada correctamente.

### Implementación — Historia de Usuario 2

- [x] T012 [US2] Implementar `GET /audit-logs` en `apps/api/src/auditoria/auditoria.controller.ts` (solo Escolastico): lista paginada con filtros por `tabla_afectada`, `usuario_id`, `accion` y rango de fechas (`fechaDesde`, `fechaHasta`)
- [x] T013 [P] [US2] Implementar `GET /audit-logs/:entidad/:entidadId`: retorna todos los logs relacionados con un registro específico de una tabla (ej. todos los cambios de una inscripción)
- [x] T014 [P] [US2] Crear página de consulta de logs en `apps/web/src/app/(admin)/auditoria/page.tsx`: tabla MUI con columnas Fecha, Usuario, Acción, Tabla, con expansión de fila para ver JSON de valor anterior/nuevo

**Punto de control**: US2 funcional — logs consultables con filtros.

---

## Fase 5: Pulido

- [x] T015 [P] Documentar endpoints de `AuditoriaController` con decoradores Swagger
- [x] T016 Validar SC-001 (100% acciones críticas registradas), SC-003 (log < 100ms adicional) mediante prueba de latencia en spec.md

---

## Dependencias

```
spec 002 (tabla logs_auditoria)
  └── Fase 1–2 (AuditoriaService — IMPLEMENTAR PRIMERO)
        └── Fase 3 (US1 — integración transversal en specs 003-010)
              └── Fase 4 (US2 — consulta de logs)
```

**Orden de implementación recomendado**: spec 012 Fase 1–2 → spec 003 → spec 004 → specs 005-010 (todos usan AuditoriaService).

## Alcance MVP
Fases 1–3 (US1): registro automático en todas las tablas auditadas. Fase 4 puede diferirse hasta tener datos reales.
