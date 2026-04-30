# Implementation Plan: Ficha de Probacionista — Instructor de Referencia

**Branch**: `017-probacionista-ficha` | **Date**: 2026-04-22 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/017-probacionista-ficha/spec.md`

## Summary

Extender la Bandeja de Aprobación para mostrar, en la ficha de cada Probacionista, el nombre del instructor de su inscripción más reciente en una materia de probacionismo (`es_curso_probacion = true`). El dato es derivado en consulta —sin modificar el esquema de BD— extendiendo `findPendingApproval()` con un `include` anidado. El frontend actualiza la tarjeta de la Bandeja de Aprobación para renderizar este campo de solo lectura.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20)  
**Primary Dependencies**: NestJS 10, Next.js 14, Prisma 5, MUI v5, Zod 3, JWT  
**Storage**: PostgreSQL (Supabase) — sin cambios de esquema  
**Testing**: Manual / e2e según quickstart.md  
**Target Platform**: Web responsive (admin desktop)  
**Project Type**: Monorepo web-service + web-app (Turborepo)  
**Performance Goals**: Carga de bandeja en < 2s con 50 Probacionistas simultáneos  
**Constraints**: Sin modificación al esquema; dato derivado en query única  
**Scale/Scope**: ~50 Probacionistas activos máximo en el MVP

## Constitution Check

*GATE: Pasado antes de Phase 0. Verificado post-diseño.*

- [x] **Data-First**: Sin cambios al esquema. Usa relaciones existentes `inscripciones → clases → materias → usuarios`.
- [x] **Mobile-First**: Bandeja de Aprobación es vista admin desktop. El dato adicional no impacta flujo móvil.
- [x] **Modular**: Solo extiende `findPendingApproval()`. No modifica otros servicios, guards ni módulos.
- [x] **Audit**: No hay acciones de escritura nuevas. `updateInterview()` de spec 003 ya cubre auditoría.
- [x] **Sessions**: Usa el modelo de clases/sesiones existente. No introduce nueva semántica de sesión.

**Resultado**: Todas las gates pasan. Sin violaciones a justificar.

## Project Structure

### Documentation (this feature)

```text
specs/017-probacionista-ficha/
├── plan.md          ← este archivo
├── spec.md
├── research.md      ← Phase 0
├── data-model.md    ← Phase 1
├── quickstart.md    ← Phase 1
├── contracts/
│   └── api.md       ← Phase 1
├── checklists/
│   └── requirements.md
└── tasks.md         ← generado por /speckit.tasks
```

### Source Code (afectado)

```text
apps/api/src/users/
├── users.service.ts     ← extender findPendingApproval()
└── users.controller.ts  ← sin cambios de firma

apps/web/src/app/(admin)/admin/users/pending/
└── page.tsx             ← agregar sección instructor de referencia
```

## Implementation Approach

### Backend

Modificar `UsersService.findPendingApproval()` para incluir en la query Prisma:

```
usuarios (Probacionistas)
  └─ inscripciones
       where: clase.materia.es_curso_probacion = true
       orderBy: fecha_inscripcion DESC
       take: 1
       └─ clase
            ├─ materia: { select: nombre }
            └─ instructor: { select: id, nombre_completo }
```

El mapeo post-query transforma la inscripción anidada en un objeto `instructor_referencia` plano.

### Frontend

Agregar en la tarjeta de `PendingUsersPage` una sección de solo lectura que muestre:
- Si `instructor_referencia != null`: nombre del instructor, materia y estado de inscripción.
- Si `instructor_referencia === null`: texto "Sin inscripción registrada".
