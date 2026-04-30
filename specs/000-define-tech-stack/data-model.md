# Data Model: Architectural Entities (Tech Stack)

## Monorepo Entities (Turborepo)

| Entity | Description | Location |
|--------|-------------|----------|
| **Turborepo Workspace** | The root of the monorepo managing apps and packages. | `/` |
| **Prisma Schema** | The single source of truth for the database schema. | `packages/database/schema.prisma` |
| **Shared Zod Schemas** | Reusable validation rules for frontend/backend consistency. | `packages/shared/src/schemas/` |
| **Global Configs** | Common settings for Eslint, Prettier, and TypeScript. | `packages/config/` |

## Domain Models (Nest.js & Next.js)

| Model | Source | Usage |
|-------|--------|-------|
| **Prisma Client** | `packages/database` | Direct database access in backend. |
| **Zod DTOs** | `packages/shared` | Input validation and Swagger documentation. |
| **MUI Theme** | `apps/web/src/theme` | Visual consistency and layout styling. |

## Relationships

- `apps/web` depends on `packages/shared` for validation and types.
- `apps/api` depends on `packages/shared` and `packages/database`.
- `packages/database` generates the client used by `apps/api`.
