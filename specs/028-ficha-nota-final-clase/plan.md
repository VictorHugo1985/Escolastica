# Implementation Plan: Ficha de Inscripción — Nota Final y Cierre de Clase

**Branch**: `028-ficha-nota-final-clase` | **Date**: 2026-05-04 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/028-ficha-nota-final-clase/spec.md`

## Summary

Exponer en la ficha de inscripción del admin el campo `nota_final` (nuevo en DB) y el campo `concluyo_temario_materia` (ya existe pero con uso limitado en UI), y agregar el botón "Finalizar clase" que cambia el estado a `Finalizada`. El backend de ambas acciones ya existe (`/conclusion` y `/status`); el trabajo es: migración de schema, extensión del endpoint `conclusion`, y cambios en una sola página de frontend.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20 (Next.js 14)  
**Primary Dependencies**: Next.js App Router, MUI v5, Prisma 5, React Hook Form, Zod, Axios  
**Storage**: PostgreSQL (via Prisma ORM)  
**Testing**: Manual — no test suite configurado  
**Target Platform**: Web responsive (desktop + móvil), desplegado en Vercel  
**Project Type**: Web application (monorepo con `apps/web`)  
**Performance Goals**: Estándar web — respuesta de API < 1s  
**Constraints**: Migración de DB debe ejecutarse antes del deploy; sin breaking changes en endpoints existentes  
**Scale/Scope**: ~50-200 alumnos activos en clases concurrentes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Data-First**: `nota_final` se agrega al schema Prisma antes de cualquier implementación de UI. La migración es el primer paso.
- [x] **Mobile-First**: Los controles de nota final (Select inline en DataGrid) y el botón "Finalizar clase" son componentes MUI nativamente responsive. El DataGrid soporta scroll horizontal en móvil.
- [x] **Modular**: Se modifica solo el endpoint `conclusion` existente (extendiendo payload) y una sola página de admin. No se toca código core ni se crean abstracciones nuevas.
- [x] **Audit**: El endpoint `status` ya registra auditoría. El endpoint `conclusion` se extenderá para incluir `nota_final` en el `valor_anterior`/`valor_nuevo` del log. ✓
- [x] **Sessions**: La feature no altera el modelo de sesiones académicas. Las inscripciones son entidades independientes de las sesiones. ✓

## Project Structure

### Documentation (this feature)

```text
specs/028-ficha-nota-final-clase/
├── plan.md              # Este archivo
├── spec.md              # Especificación funcional
├── research.md          # Hallazgos del código existente y decisiones
├── data-model.md        # Cambios al schema y entidades
├── quickstart.md        # Guía de implementación paso a paso
├── contracts/
│   └── api-endpoints.md # Contratos de API (extendidos/nuevos)
└── checklists/
    └── requirements.md  # Checklist de calidad de la especificación
```

### Source Code (archivos a modificar)

```text
apps/web/
├── prisma/
│   └── schema.prisma                                          # +1 campo nota_final
├── src/app/
│   ├── api/
│   │   └── inscripciones/[id]/conclusion/route.ts             # Extender payload + audit
│   └── (admin)/admin/clases/[id]/
│       └── page.tsx                                           # +columna nota_final +botón Finalizar
```

**Structure Decision**: Monorepo Next.js bajo `apps/web/`. Toda la lógica en App Router. Sin cambios de estructura de carpetas.

## Complexity Tracking

> No hay violaciones de la Constitución. Sección omitida.

## Phase 0: Research — COMPLETADA

Ver [research.md](./research.md) para el análisis completo.

**Resumen de decisiones**:
- `nota_final` va en `inscripciones` (no en `notas`) — es atributo de cierre, no evaluación parcial
- Se extiende el endpoint `/conclusion` (no se crea endpoint nuevo) — mismos actores, mismo concepto de cierre
- "Finalizar clase" usa el endpoint `/status` ya existente — solo falta el botón en UI
- Patrón de edición inline (Select en DataGrid) consistente con el Checkbox de conclusión ya implementado

## Phase 1: Design — COMPLETADA

Ver artefactos:
- [data-model.md](./data-model.md) — campo nuevo y transiciones de estado
- [contracts/api-endpoints.md](./contracts/api-endpoints.md) — contratos de API
- [quickstart.md](./quickstart.md) — pasos de implementación y flujo de prueba

## Tareas de Implementación (alto nivel)

| # | Tarea | Archivo | Estimado |
|---|-------|---------|---------|
| 1 | Agregar `nota_final EstadoNota?` en `schema.prisma` y ejecutar migración | `prisma/schema.prisma` | 15 min |
| 2 | Extender `PATCH /conclusion` para aceptar y persistir `nota_final` + auditoría | `conclusion/route.ts` | 20 min |
| 3 | Agregar columna `nota_final` (Select inline) al DataGrid en la página de clase | `clases/[id]/page.tsx` | 30 min |
| 4 | Agregar botón "Finalizar clase" + Dialog de confirmación | `clases/[id]/page.tsx` | 30 min |
| 5 | Prueba manual del flujo completo | — | 20 min |

**Siguiente comando**: `/speckit.tasks` para generar el desglose detallado de tareas.
