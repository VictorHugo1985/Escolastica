# Implementation Plan: Configuración de Enumeraciones de la Aplicación

**Branch**: `029-config-enums` | **Date**: 2026-05-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/029-config-enums/spec.md`

## Summary

Reemplazar los 4 tipos PostgreSQL enum configurables (`TipoSesion`, `EstadoNota`, `TipoNotaFinal`, `MotivoBaja`) por dos tablas relacionales dinámicas (`enum_categorias` + `enum_valores`), y proveer una pantalla de administración en `/admin/configuracion/enums` desde la cual el Escolástico puede agregar, renombrar, reordenar y desactivar valores en tiempo real. Los selectores de toda la aplicación que usaban esos enums hardcodeados pasarán a leer sus opciones desde la API.

## Technical Context

**Language/Version**: TypeScript — Node.js 20 (Next.js 14 App Router)
**Primary Dependencies**: Next.js 14, Prisma ORM, MUI v5, Zod, Supabase PostgreSQL
**Storage**: PostgreSQL vía Supabase (session pooler)
**Testing**: Flujo manual end-to-end (quickstart.md)
**Target Platform**: Web admin (escritorio), responsive
**Project Type**: Web application — admin feature
**Performance Goals**: Respuesta de endpoints de configuración < 500 ms; carga de dropdowns < 300 ms
**Constraints**: Zero downtime migration — datos existentes se migran con seed SQL; columnas cambian de enum a VARCHAR
**Scale/Scope**: ~5 categorías, ≤50 valores por categoría, uso concurrente bajo (solo Escolásticos)

## Constitution Check

- [x] **Data-First**: Nuevas tablas `enum_categorias` / `enum_valores` definidas antes de cualquier implementación. Cambios a columnas existentes documentados en data-model.md. Requiere anotación en Spec 003.
- [x] **Mobile-First**: Feature de configuración/administración — la constitución establece explícitamente "las funcionalidades administrativas estarán optimizadas para entorno web de escritorio". N/A para mobile.
- [x] **Modular**: Las tablas existentes SE MODIFICAN (cambio de tipo de columna enum → VARCHAR). **Justificación**: los tipos enum de PostgreSQL no son extensibles en tiempo de ejecución sin migraciones de DB, lo que imposibilita la configurabilidad desde la UI. Es la única opción técnicamente viable para cumplir FR-003 y el escenario de prueba independiente de US1. Alternativa rechazada: tabla de labels paralela (no permite agregar nuevos valores sin deploy).
- [x] **Audit**: FR-010 exige registro en `logs_auditoria` de toda creación, modificación y desactivación de valores. Implementado en todos los endpoints WRITE.
- [x] **Sessions**: No aplica a este feature.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Modificación de columnas existentes (sesiones, inscripciones, notas, notas_finales_inscripcion) | Los tipos enum de PG no permiten agregar valores en runtime desde la app | Tabla de etiquetas paralela: solo permite renombrar, no agregar nuevos valores; viola el escenario de aceptación "agregar Taller → verlo en selector" |

## Project Structure

### Documentation (this feature)

```text
specs/029-config-enums/
├── plan.md              ← este archivo
├── research.md          ← decisiones técnicas
├── data-model.md        ← entidades nuevas + cambios a columnas
├── quickstart.md        ← escenarios de integración
├── contracts/
│   └── api.md           ← contratos de endpoints
└── tasks.md             ← generado por /speckit.tasks
```

### Source Code — archivos nuevos

```text
packages/database/
├── schema.prisma                              (modificado: +2 modelos, 5 columnas cambian tipo)
└── migrations/
    └── 20260511000000_config_enums/
        └── migration.sql

apps/web/src/app/
├── api/config/enums/
│   ├── route.ts                               (GET categorías)
│   └── [categoria]/
│       ├── route.ts                           (GET valores de categoría)
│       └── valores/
│           ├── route.ts                       (POST nuevo valor)
│           └── [id]/
│               └── route.ts                  (PATCH editar valor)
└── (admin)/admin/configuracion/enums/
    └── page.tsx                               (UI de gestión)
```

### Source Code — archivos modificados

```text
apps/web/src/app/
├── (admin)/admin/clases/[id]/page.tsx         (selectores TipoSesion, TipoNotaFinal, EstadoNota)
├── api/sesiones/route.ts                      (POST sesión: validar tipo desde tabla)
├── api/inscripciones/[id]/conclusion/route.ts (PATCH: motivo_baja desde tabla)
└── api/inscripciones/[id]/notas-finales/route.ts (POST: tipo_nota y valor desde tabla)

apps/web/src/components/ui/Sidebar.tsx         (agregar link Configuración → Enumeraciones)
```
