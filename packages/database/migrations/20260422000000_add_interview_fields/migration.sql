-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "fecha_entrevista" DATE,
ADD COLUMN "entrevista_completada" BOOLEAN NOT NULL DEFAULT false;
