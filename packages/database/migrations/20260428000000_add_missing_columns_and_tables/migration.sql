-- Migration: add missing columns and tables to align schema.prisma with DB
-- Adds: password_hash, fecha_inscripcion to usuarios
--       nullable email, unique ci
--       refresh_tokens and tokens_recuperacion tables
--       ExMiembro enum value
--       ExProbacionista to Rol enum (idempotent)

-- 1. Columns missing from usuarios + fix missing DEFAULT on id
ALTER TABLE "usuarios"
  ADD COLUMN IF NOT EXISTS "password_hash" TEXT,
  ADD COLUMN IF NOT EXISTS "fecha_inscripcion" DATE;

ALTER TABLE "usuarios" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- 2. Make email nullable (was NOT NULL in init migration, schema.prisma has it optional)
ALTER TABLE "usuarios" ALTER COLUMN "email" DROP NOT NULL;

-- 3. Unique constraint on ci (schema has @unique)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_ci_key'
  ) THEN
    ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_ci_key" UNIQUE ("ci");
  END IF;
END $$;

-- 4. Add ExMiembro to Rol enum if not present
ALTER TYPE "Rol" ADD VALUE IF NOT EXISTS 'ExMiembro';

-- 5. refresh_tokens table
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "usuario_id"  UUID        NOT NULL,
  "token_hash"  TEXT        NOT NULL,
  "expires_at"  TIMESTAMPTZ NOT NULL,
  "revoked"     BOOLEAN     NOT NULL DEFAULT false,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

ALTER TABLE "refresh_tokens"
  DROP CONSTRAINT IF EXISTS "refresh_tokens_usuario_id_fkey";

ALTER TABLE "refresh_tokens"
  ADD CONSTRAINT "refresh_tokens_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. tokens_recuperacion table
CREATE TABLE IF NOT EXISTS "tokens_recuperacion" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "usuario_id"  UUID        NOT NULL,
  "token"       TEXT        NOT NULL,
  "expires_at"  TIMESTAMPTZ NOT NULL,
  "used"        BOOLEAN     NOT NULL DEFAULT false,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "tokens_recuperacion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tokens_recuperacion_token_key" ON "tokens_recuperacion"("token");

ALTER TABLE "tokens_recuperacion"
  DROP CONSTRAINT IF EXISTS "tokens_recuperacion_usuario_id_fkey";

ALTER TABLE "tokens_recuperacion"
  ADD CONSTRAINT "tokens_recuperacion_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
