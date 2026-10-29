-- Spec 032: material de clase. Solo crea tablas nuevas; no modifica tablas existentes.

CREATE TABLE "material_clase" (
  "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
  "clase_id"    UUID NOT NULL,
  "comentarios" TEXT,
  "creado_por"  UUID,
  "created_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "material_clase_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "material_clase_clase_id_key" ON "material_clase"("clase_id");

CREATE TABLE "pagos_material" (
  "id"                UUID NOT NULL DEFAULT gen_random_uuid(),
  "material_clase_id" UUID NOT NULL,
  "inscripcion_id"    UUID NOT NULL,
  "fecha"             DATE NOT NULL,
  "monto"             DECIMAL(8,1) NOT NULL,
  "comentarios"       TEXT,
  "registrado_por"    UUID,
  "created_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"        TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "pagos_material_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pagos_material_monto_check" CHECK ("monto" >= 0)
);
CREATE INDEX "pagos_material_material_clase_id_inscripcion_id_idx"
  ON "pagos_material"("material_clase_id", "inscripcion_id");

CREATE TABLE "pago_material_temas" (
  "pago_id" UUID NOT NULL,
  "tema_id" UUID NOT NULL,
  CONSTRAINT "pago_material_temas_pkey" PRIMARY KEY ("pago_id", "tema_id")
);

ALTER TABLE "material_clase" ADD CONSTRAINT "material_clase_clase_id_fkey"
  FOREIGN KEY ("clase_id") REFERENCES "clases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_clase" ADD CONSTRAINT "material_clase_creado_por_fkey"
  FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pagos_material" ADD CONSTRAINT "pagos_material_material_clase_id_fkey"
  FOREIGN KEY ("material_clase_id") REFERENCES "material_clase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pagos_material" ADD CONSTRAINT "pagos_material_inscripcion_id_fkey"
  FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pagos_material" ADD CONSTRAINT "pagos_material_registrado_por_fkey"
  FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pago_material_temas" ADD CONSTRAINT "pago_material_temas_pago_id_fkey"
  FOREIGN KEY ("pago_id") REFERENCES "pagos_material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pago_material_temas" ADD CONSTRAINT "pago_material_temas_tema_id_fkey"
  FOREIGN KEY ("tema_id") REFERENCES "temas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
