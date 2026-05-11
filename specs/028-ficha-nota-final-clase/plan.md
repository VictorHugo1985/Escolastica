# Implementation Plan: Ficha de Inscripción — Nota Final y Cierre de Clase

**Branch**: `028-ficha-nota-final-clase` | **Date**: 2026-05-09 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/028-ficha-nota-final-clase/spec.md`

## Summary

Agregar gestión de múltiples notas finales tipificadas por inscripción. Reemplaza la solución anterior (campo único `nota_final` en `inscripciones`) con una tabla separada `notas_finales_inscripcion`, donde cada registro relaciona una inscripción con un tipo de nota (`Nota Teórica`, `Nota Práctica`, `Examen Final`, `Trabajo Escrito`) y un valor de calificación (`Sobresaliente`, `Solido`, `Aprobado`, `Reprobado`), con unicidad por (inscripcion_id, tipo_nota). La UI reemplaza el Select inline del DataGrid con un diálogo de gestión por inscripción. El cierre de clase ya está implementado en UI y backend.

## Technical Context

**Language/Version**: TypeScript, Next.js 14 (App Router), React 18  
**Primary Dependencies**: MUI v5, MUI DataGrid, Prisma 5, PostgreSQL, React Hook Form  
**Storage**: PostgreSQL (vía Prisma ORM)  
**Testing**: Pruebas manuales por acceptance scenarios  
**Target Platform**: Web responsive, mobile-first  
**Project Type**: Web admin panel (monorepo Turbo/pnpm)  
**Performance Goals**: Operaciones de nota en < 500ms; carga de clase con inscripciones en < 1s  
**Constraints**: Rutas de API via Next.js (`/api/*`), no NestJS. Prisma migrations en DB local y deploy separado.  
**Scale/Scope**: ~50 inscripciones por clase; ~4 tipos de nota por inscripción

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Data-First**: Nueva entidad `notas_finales_inscripcion` diseñada antes de implementar. Requiere referencia en Spec 003.
- [x] **Mobile-First**: Diálogo de gestión de notas usa full-screen en mobile; lista de notas como chips compactos en DataGrid.
- [x] **Modular**: Se agrega nueva tabla como extensión. El campo `nota_final` en `inscripciones` fue agregado en esta misma rama (no es parte del esquema base original) por lo que su reemplazo no viola el principio.
- [x] **Audit**: Las operaciones POST y DELETE de notas finales registrarán en `logs_auditoria`.
- [x] **Sessions**: No aplica directamente — las notas finales son por inscripción (relación alumno-clase), no por sesión.

## Project Structure

### Documentation (this feature)

```text
specs/028-ficha-nota-final-clase/
├── plan.md              ← este archivo
├── research.md          ← decisiones de diseño actualizadas
├── data-model.md        ← schema nueva tabla + migración
├── quickstart.md        ← pasos de implementación
├── contracts/           ← contratos API actualizados
└── tasks.md             ← generado por /speckit.tasks
```

### Source Code (archivos a modificar/crear)

```text
packages/database/
└── schema.prisma                                          MODIFICAR

apps/web/src/app/api/inscripciones/[id]/
├── conclusion/route.ts                                    MODIFICAR (quitar nota_final)
├── notas-finales/route.ts                                 CREAR (POST)
└── notas-finales/[notaId]/route.ts                        CREAR (DELETE)

apps/web/src/app/(admin)/admin/clases/[id]/
└── page.tsx                                               MODIFICAR (columna + diálogo)
```

## Complexity Tracking

> No hay violaciones a la Constitución. El reemplazo de `nota_final` en `inscripciones` está justificado porque dicho campo fue agregado en esta misma rama (migración `20260504000000`) y no forma parte del esquema base original aprobado.
