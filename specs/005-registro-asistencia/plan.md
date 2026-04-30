# Implementation Plan: Registro de Asistencia

**Branch**: `005-attendance-tracking` | **Date**: 2026-04-24 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/005-registro-asistencia/spec.md`

## Summary

Sistema de registro de asistencia mobile-first que permite a Instructores y Escolásticos crear sesiones académicas y marcar estados (`Presente`, `Ausente`, `Licencia`) para los alumnos inscritos en una clase. El Instructor primero ve sus clases del día (filtradas por `horario.dia_semana`) y tambien le permite navegar por otras clases ya creadas; el Escolástico ve todas las clases activas del sistema. Las asistencias se persisten vía upsert masivo vinculado a `sesiones` e `inscripciones`. La vista de escritorio expone historial y porcentajes; el alumno consulta su propio resumen en el Kardex.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: NestJS 10, Next.js 14 (App Router), Prisma ORM, MUI v5, Zod, Zustand  
**Storage**: PostgreSQL via Supabase — tablas `sesiones`, `asistencias`, `inscripciones`, `clases`, `horarios`  
**Testing**: Manual (playwright no configurado aún)  
**Target Platform**: Web responsive + Mobile-first (Chrome/Safari iOS)  
**Project Type**: Web service (monorepo: `apps/api` + `apps/web`)  
**Performance Goals**: Lista de alumnos carga < 1 seg en móvil (SC-003); pase de lista < 30 seg para 20 alumnos (SC-001)  
**Constraints**: Online-only; sin modificación del esquema de datos base (Constitución)  
**Scale/Scope**: ~200 alumnos, ~20 clases activas simultáneas

## Constitution Check

- [x] **Data-First**: Usa tablas `sesiones` y `asistencias` definidas en Spec 002 (diccionario master). Sin modificaciones al esquema.
- [x] **Mobile-First**: Vistas en `(instructor)/asistencia/*` diseñadas para touch (cards grandes, toggle de 3 estados, botón pegado al fondo).
- [x] **Modular**: `SesionesModule` nuevo, independiente. No modifica módulos existentes salvo import en `AppModule`.
- [x] **Audit**: `AsistenciasService.updateOne()` registra `actorId` + valor anterior/nuevo en `logs_auditoria` via `AuditoriaService`.
- [x] **Sessions**: Toda asistencia se vincula a una `sesion` del día (modelo sesión-based). `getOrCreateToday()` es idempotente.

## Project Structure

### Documentation (this feature)

```text
specs/005-registro-asistencia/
├── plan.md              ✓ Este archivo
├── research.md          ✓ Decisiones técnicas
├── data-model.md        ✓ Entidades y relaciones
├── quickstart.md        ✓ Escenarios de integración
├── contracts/           ✓ Contratos de API
│   ├── sesiones.md
│   └── asistencias.md
└── tasks.md             ✓ Tareas completadas
```

### Source Code

```text
apps/api/src/sesiones/
├── sesiones.module.ts          ← SesionesModule
├── sesiones.service.ts         ← findByClase, createSesion, getOrCreateToday, findClasesHoy
├── asistencias.service.ts      ← bulkUpsert, findBySesion, calcularPorcentajePorAlumno, updateOne
└── sesiones.controller.ts      ← 7 endpoints REST

packages/shared/src/schemas/
├── sesion.schema.ts            ← CreateSesionSchema / CreateSesionDto
└── asistencia.schema.ts        ← BulkAsistenciaSchema, UpdateAsistenciaSchema / Dtos

apps/web/src/app/
├── (instructor)/asistencia/
│   ├── page.tsx                ← Selección de clase del día (mobile)
│   └── [claseId]/page.tsx     ← Pase de lista con toggle (mobile)
├── (admin)/admin/asistencia/
│   ├── page.tsx                ← Selección de clase del día (desktop + sidebar)
│   └── [claseId]/page.tsx     ← Pase de lista con sidebar
└── (admin)/admin/kardex/
    └── page.tsx                ← Kardex del usuario autenticado

apps/web/src/components/layout/
└── Sidebar.tsx                 ← Items "Pase de lista" + "Kardex" con filtrado por rol
```
