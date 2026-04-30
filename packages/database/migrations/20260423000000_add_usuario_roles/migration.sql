-- Migration: add_usuario_roles
-- Migrates from single rol_id FK on usuarios to many-to-many usuario_roles table

-- Step 1: Create the junction table
CREATE TABLE "usuario_roles" (
    "usuario_id" UUID NOT NULL,
    "rol_id" UUID NOT NULL,
    "asignado_por_id" UUID,
    "fecha_asignacion" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "usuario_roles_pkey" PRIMARY KEY ("usuario_id","rol_id")
);

-- Step 2: Migrate existing role assignments
INSERT INTO "usuario_roles" ("usuario_id", "rol_id", "fecha_asignacion")
SELECT "id", "rol_id", NOW() FROM "usuarios";

-- Step 3: Add foreign key constraints
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_usuario_id_fkey"
    FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_rol_id_fkey"
    FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_asignado_por_id_fkey"
    FOREIGN KEY ("asignado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 4: Drop the old rol_id column and its FK constraint
ALTER TABLE "usuarios" DROP CONSTRAINT IF EXISTS "usuarios_rol_id_fkey";
ALTER TABLE "usuarios" DROP COLUMN "rol_id";
