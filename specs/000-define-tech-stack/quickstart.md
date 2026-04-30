# Quickstart: Development Setup (Escolastica)

## Prerequisites

- Node.js (Latest LTS)
- npm or pnpm (recommended)
- Docker (optional, for local PostgreSQL/Supabase)
- VS Code (recommended extensions: Eslint, Prettier, Prisma, Tailwind CSS - if used)

## Initial Setup

1. **Clone the repository**:
   ```bash
   git clone [repo-url]
   cd Escolastica
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   Copy `.env.example` to `.env` in `apps/web/`, `apps/api/`, and `packages/database/`. Update with your Supabase credentials.

4. **Initialize Database**:
   ```bash
   npx turbo db:push --filter=database
   ```

5. **Start Development Environment**:
   ```bash
   npm run dev
   ```
   This will start both the Next.js frontend and the Nest.js backend using Turborepo.

## Project Structure at a Glance

- **`apps/web`**: Next.js frontend (App Router).
- **`apps/api`**: Nest.js backend.
- **`packages/shared`**: Common Zod schemas and TypeScript interfaces.
- **`packages/database`**: Prisma schema and client generation.

## Common Commands

- `npm run build`: Build all applications and packages.
- `npm run lint`: Run linting across the monorepo.
- `npm run test`: Run Vitest tests for all projects.
