-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "foto_url",
ADD COLUMN "file_actualizado" BOOLEAN NOT NULL DEFAULT false;
