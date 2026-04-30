# Escolastica Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-21

## Active Technologies
- TypeScript 5.x (Node.js 20) + NestJS 10, Next.js 14, Prisma 5, MUI v5, Zod 3, JWT (passport-jwt), Vites (018-roles-multiples)
- PostgreSQL (Supabase) — migración de esquema requerida (018-roles-multiples)
- PostgreSQL (Supabase) via Prisma (018-roles-multiples)
- TypeScript 5.x / Node.js 20 (LTS) + NestJS 10, Next.js 14, Prisma 5, Zod 3, Material UI v5, Passport (JWT) (018-roles-multiples)
- TypeScript (Node 20 LTS) + NestJS, Prisma Client, Next.js 14 (App Router) (024-asistencia-privilegios-escolastico)
- PostgreSQL (Supabase) — sin cambios de schema (024-asistencia-privilegios-escolastico)
- TypeScript 5.x (Node.js 20 backend, Next.js 14 frontend) + NestJS, Prisma ORM, MUI v5, Zod, React Hook Form + zodResolver (025-horario-fijo-clases)
- PostgreSQL (Supabase) — tabla `horarios` ya existe con esquema correcto (025-horario-fijo-clases)
- TypeScript 5.4 / Node.js 20 (027-csv-import-export-users)
- PostgreSQL vía Prisma (tablas existentes: `usuarios`, `usuario_roles`, `roles`) (027-csv-import-export-users)

- TypeScript / Node.js (Latest LTS) + Next.js (App Router), Nest.js, Supabase (PostgreSQL), Prisma, Zod, Material UI (MUI), TanStack Query, Sentry (000-define-tech-stack)
- Nest.js AuthModule: JWT local (bcrypt cost 12, HttpOnly cookies, Passport), Rate Limiting 5 intentos/15 min (001-especificaciones-no-funcionales)
- Prisma Client / Migrate for PostgreSQL (002-diccionario-datos)

## Auth Rules

- Authentication: JWT generado localmente por Nest.js `AuthModule`. Supabase Auth NO se utiliza.
- Roles canónicos (enum BD): `Escolastico`, `Instructor`, `Miembro`, `Probacionista`, `Ex-miembro`
- Login de Probacionistas: bloqueado siempre (retorna error 403 con mensaje de cuenta pendiente)
- Refresh Token: HttpOnly cookie, Secure, SameSite=Strict

## Project Structure

```text
packages/database/    # Centralized data model and Prisma client
  - schema.prisma     # Entity definitions (Roles, Usuarios, Materias, Clases, Sesiones, etc.)
  - seed.ts           # Initial data seed (Roles)
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript / Node.js (Latest LTS): Follow standard conventions

## Recent Changes
- 027-csv-import-export-users: Added TypeScript 5.4 / Node.js 20
- 025-horario-fijo-clases: Added TypeScript 5.x (Node.js 20 backend, Next.js 14 frontend) + NestJS, Prisma ORM, MUI v5, Zod, React Hook Form + zodResolver
- 024-asistencia-privilegios-escolastico: Added [if applicable, e.g., PostgreSQL, CoreData, files or N/A]


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
