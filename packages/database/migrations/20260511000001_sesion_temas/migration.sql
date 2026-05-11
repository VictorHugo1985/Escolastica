-- CreateTable
CREATE TABLE "sesion_temas" (
    "sesion_id" UUID NOT NULL,
    "tema_id"   UUID NOT NULL,

    CONSTRAINT "sesion_temas_pkey" PRIMARY KEY ("sesion_id","tema_id")
);

-- Migrate existing single-tema data
INSERT INTO "sesion_temas" ("sesion_id", "tema_id")
SELECT "id", "tema_id" FROM "sesiones" WHERE "tema_id" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "sesion_temas" ADD CONSTRAINT "sesion_temas_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "sesiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion_temas" ADD CONSTRAINT "sesion_temas_tema_id_fkey" FOREIGN KEY ("tema_id") REFERENCES "temas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "sesiones" DROP COLUMN "tema_id";
