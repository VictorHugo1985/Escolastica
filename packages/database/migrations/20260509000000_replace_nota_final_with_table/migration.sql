-- CreateEnum
CREATE TYPE "TipoNotaFinal" AS ENUM ('Nota_Teorica', 'Nota_Practica', 'Examen_Final', 'Trabajo_Escrito');

-- CreateTable
CREATE TABLE "notas_finales_inscripcion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inscripcion_id" UUID NOT NULL,
    "tipo_nota" "TipoNotaFinal" NOT NULL,
    "valor" "EstadoNota" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notas_finales_inscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notas_finales_inscripcion_inscripcion_id_tipo_nota_key" ON "notas_finales_inscripcion"("inscripcion_id", "tipo_nota");

-- AddForeignKey
ALTER TABLE "notas_finales_inscripcion" ADD CONSTRAINT "notas_finales_inscripcion_inscripcion_id_fkey" FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "inscripciones" DROP COLUMN "nota_final";
