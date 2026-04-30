# Implementation Plan: Roles Múltiples por Usuario

**Branch**: `018-roles-multiples` | **Date**: 2026-04-23 | **Spec**: `/specs/018-roles-multiples/spec.md`
**Input**: Feature specification from `/specs/018-roles-multiples/spec.md`

## Summary

This feature transitions the system from a single-role-per-user model to a multi-role model (Many-to-Many relationship). It introduces a `usuario_roles` junction table with comprehensive audit fields (assigned_by, revoked_by). Key technical changes include updating the JWT session to store role arrays, implementing a "Silent Refresh" mechanism to synchronize permissions without logout, and updating the UI to display color-coded chips for active roles sorted by hierarchy (Escolástico > Instructor > Miembro).

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20 (LTS)
**Primary Dependencies**: NestJS 10, Next.js 14, Prisma 5, Zod 3, Material UI v5, Passport (JWT)
**Storage**: PostgreSQL (Supabase) via Prisma
**Testing**: Vitest / Jest (npm test)
**Target Platform**: Web (Responsive/Mobile-first)
**Project Type**: Monorepo (Turbo) with separate API and Web apps
**Performance Goals**: JWT verification overhead < 10ms, Silent refresh latency < 500ms
**Constraints**: Exclusion rules for "Probacionista" and "Ex-miembro" must be enforced at the DB level.

## Constitution Check

- [x] **Data-First**: Junction table `usuario_roles` follows the naming convention and relationship structure of Spec 003.
- [x] **Mobile-First**: Role chips in user lists are designed for high-density display on mobile.
- [x] **Modular**: Permission checks will be refactored into a shared Guard/Decorator to avoid duplication.
- [x] **Audit**: `usuario_roles` table includes `asignado_por_id` and `revocado_por_id` for full lifecycle tracking.
- [x] **Sessions**: FR-011 ensures session consistency via silent refresh.

## Project Structure

### Documentation (this feature)

```text
specs/018-roles-multiples/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
apps/api/src/
├── auth/                # Update JWT strategy & Refresh logic
├── common/guards/       # Update RolesGuard for array checks
└── users/               # Update user creation/update logic
apps/web/src/
├── components/          # RoleChip component
└── lib/auth/            # Silent refresh interceptor
packages/database/
└── schema.prisma        # Migration from user.rol_id to usuario_roles
```

**Structure Decision**: Standard Monorepo structure. Database changes happen in `packages/database`, business logic in `apps/api`, and UI in `apps/web`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| M:N Relation | Real-world requirement: instructors are also students (members). | 1:N is too rigid for the organizational model. |
| Silent Refresh | Seamless permission updates without forcing user re-login. | Manual logout is poor UX for operational users. |
