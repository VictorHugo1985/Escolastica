# Tareas: Reportes y Análisis Administrativo — 011

**Entrada**: Documentos de diseño de `/specs/011-admin-reports-analysis/`
**Prerrequisitos**: spec.md | **Depende de**: spec 001 (AuthModule), spec 005 (asistencias), spec 006 (notas/kardex), spec 007 (inscripciones/historial)

## Formato: `- [ ] [ID] [P?] [Story?] Descripción con ruta de archivo`

---

## Fase 1: Setup

- [ ] T001 Crear `ReportsModule` en `apps/api/src/reports/reports.module.ts` con imports de PrismaModule y AuthModule
- [ ] T002 [P] Instalar dependencias de exportación: `@nestjs/serve-static`, `pdfkit` (o `puppeteer` headless), y `json2csv` en `apps/api/package.json`

---

## Fase 2: Fundacional

- [ ] T003 Implementar `ReportsService` en `apps/api/src/reports/reports.service.ts` con métodos de agregación: `getAsistenciaResumen(filtros)`, `getRendimientoAcademico(filtros)`, `getMovimientosAlumnos(filtros)`
- [ ] T004 Definir tipo `ReportFiltros` en `packages/shared/src/types/report-filtros.ts`: `{ claseId?, materiaId?, instructorId?, fechaDesde?, fechaHasta?, anioInicio?, mesInicio? }` (sin periodo académico per clarificación 2026-04-21)

**Punto de control**: Servicio de agregación listo.

---

## Fase 3: Historia de Usuario 1 — Dashboard Global de Asistencia (P1) 🎯 MVP

**Objetivo**: El Escolástico ve en escritorio el % de asistencia por clase/materia con desglose al hacer clic.

**Prueba Independiente**: `GET /reports/asistencia` con filtros de fecha retorna estadísticas correctas (verificar con datos conocidos). Clic en materia → desglose por alumno y fecha coincide con datos en BD.

### Implementación — Historia de Usuario 1

- [ ] T005 [US1] Implementar `GET /reports/asistencia` en `apps/api/src/reports/reports.controller.ts`: agrega % asistencia por clase, filtrable por `anioInicio`, `mesInicio`, `materiaId` (consume `AsistenciasService` de spec 005)
- [ ] T006 [P] [US1] Implementar `GET /reports/asistencia/detalle?claseId=:id&fechaDesde=:d&fechaHasta=:h`: desglose de asistencia por alumno y fecha para una clase
- [ ] T007 [US1] Crear página de reporte de asistencia en `apps/web/src/app/(admin)/reportes/asistencia/page.tsx`: tabla comparativa de clases con % asistencia, filtros por mes/año y materia, clic en fila expande el desglose

**Punto de control**: US1 funcional — dashboard de asistencia operativo.

---

## Fase 4: Historia de Usuario 2 — Análisis de Rendimiento Académico (P1)

**Objetivo**: El Escolástico visualiza distribución de notas, promedio y tasa de aprobación por clase filtrada por mes/año e instructor.

**Prueba Independiente**: `GET /reports/rendimiento?claseId=:id` retorna `{ promedio, nota_max, nota_min, tasa_aprobacion, distribucion: { Sobresaliente: N, Aprobo: N, Repite: N } }`.

### Implementación — Historia de Usuario 2

- [ ] T008 [US2] Implementar `GET /reports/rendimiento` en `ReportsController`: agrega notas por clase/materia/instructor. Retorna promedio, distribución de notas y tasa de aprobación
- [ ] T009 [P] [US2] Crear página de análisis académico en `apps/web/src/app/(admin)/reportes/rendimiento/page.tsx`: tabla con columnas Materia, Clase, Instructor, % Aprobación, distribución de notas (chip por Enum) + filtros por mes/año e instructor

**Punto de control**: US2 funcional — análisis de rendimiento por clase.

---

## Fase 5: Historia de Usuario 3 — Auditoría de Movimientos (P1)

**Objetivo**: El Escolástico ve el log de altas y bajas del periodo filtrado por tipo, con motivo y usuario que registró el movimiento.

**Prueba Independiente**: `GET /reports/movimientos?tipo=Baja&fechaDesde=:d` retorna lista con Nombre, Materia, Fecha, Motivo y nombre del usuario que registró la baja.

### Implementación — Historia de Usuario 3

- [ ] T010 [US3] Implementar `GET /reports/movimientos` en `ReportsController`: retorna historial de inscripciones con altas y bajas, filtrable por tipo (Alta/Baja), rango de fechas, clase y alumno
- [ ] T011 [P] [US3] Crear página de reporte de movimientos en `apps/web/src/app/(admin)/reportes/movimientos/page.tsx`: tabla cronológica con columnas Alumno, Materia, Clase, Tipo, Fecha, Motivo, Registrado por

**Punto de control**: US3 funcional — auditoría de movimientos operativa.

---

## Fase 6: Historia de Usuario 4 — Exportación de Datos (P2)

**Objetivo**: Cualquier reporte filtrado puede exportarse a CSV o PDF.

**Prueba Independiente**: Aplicar filtros en reporte de asistencia, hacer clic "Exportar CSV" → archivo descargado con exactamente las filas visibles en pantalla. "Exportar PDF" → documento con formato de impresión.

### Implementación — Historia de Usuario 4

- [ ] T012 [US4] Implementar `GET /reports/asistencia/export?format=csv|pdf` en `ReportsController`: acepta mismos filtros que T005, genera archivo con `json2csv` (CSV) o `pdfkit` (PDF)
- [ ] T013 [P] [US4] Implementar `GET /reports/rendimiento/export?format=csv|pdf` con misma lógica
- [ ] T014 [P] [US4] Implementar `GET /reports/movimientos/export?format=csv|pdf` con misma lógica
- [ ] T015 [P] [US4] Agregar botones "Exportar CSV" y "Exportar PDF" en las tres páginas de reportes, habilitados solo cuando hay datos filtrados visibles

**Punto de control**: US4 funcional — exportación CSV y PDF desde cualquier reporte.

---

## Fase 7: Pulido

- [ ] T016 [P] Documentar endpoints de `ReportsController` con decoradores Swagger
- [ ] T017 Validar SC-001 (reportes < 2 seg con 10,000 registros), SC-004 (PDF < 5 seg) según `spec.md`

---

## Dependencias

```
spec 005 (asistencias) + spec 006 (notas) + spec 007 (inscripciones)
  └── Fase 1–2
        ├── Fase 3 (US1 — Asistencia) 🎯 MVP
        ├── Fase 4 (US2 — Rendimiento)
        ├── Fase 5 (US3 — Movimientos)
        └── Fase 6 (US4 — Exportación) [REQUIERE US1+US2+US3]
```

## Alcance MVP
Fases 1–5 (US1+US2+US3): dashboard de asistencia, rendimiento y auditoría de movimientos sin exportación.
