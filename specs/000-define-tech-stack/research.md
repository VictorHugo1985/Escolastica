# Research: Tech Stack & Monorepo Architecture

## Resolved Clarifications

### Testing Stack (NEEDS CLARIFICATION)
- **Decision**: Use **Vitest** for unit and integration testing across the monorepo, and **Playwright** for E2E testing.
- **Rationale**: Vitest is faster and offers better compatibility with ES Modules and Vite-based projects like Next.js (via Turborepo). Playwright provides superior developer experience and performance for E2E.
- **Alternatives considered**: Jest (slower, configuration complexity with ESM), Cypress (heavier resource usage, slower).

### Zod-to-Class Transformation in Nest.js
- **Decision**: Use `nestjs-zod` or a custom pipe combining `zod` and `class-transformer`.
- **Rationale**: Ensures that Zod schemas defined in `packages/shared` can be used as DTOs in Nest.js controllers with full Swagger support.
- **Alternatives considered**: Manually defining classes and applying Zod validation in pipes (violates DRY).

### Schema-First with Prisma in Turborepo
- **Decision**: Centralize `schema.prisma` in `packages/database`. Applications will import the generated client.
- **Rationale**: Guarantees a single source of truth for the database structure. Changes to the schema require a rebuild of the database package.
- **Alternatives considered**: Duplicating schema in apps (high risk of drift).

## Technology Best Practices

### Monorepo Management (Turborepo)
- Use remote caching for CI/CD optimization.
- Define explicit task dependencies in `turbo.json` (e.g., `build` depends on `^build`).

### Nest.js Modular Architecture
- Each functional area (e.g., `attendance`, `grades`) must be a self-contained module.
- Use a `CoreModule` for global providers (Supabase client, Logger).

### Next.js App Router & MUI
- Use `use client` directives sparingly to maintain Server Component benefits.
- Implement a custom MUI theme provider that supports both light and dark modes (if required) and ensures consistent spacing.

### Supabase Integration
- Use the Supabase Service Role Key only for backend operations that require bypassing RLS.
- Frontend should use the anonymous key and rely on JWT-based authentication via the Nest.js backend.
