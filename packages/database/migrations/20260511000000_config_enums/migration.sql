-- Migration: 20260511000000_config_enums
-- Replaces PostgreSQL enum types TipoSesion, EstadoNota, TipoNotaFinal, MotivoBaja
-- with dynamic tables enum_categorias + enum_valores

-- 1. Create enum_categorias table
CREATE TABLE "enum_categorias" (
  "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
  "nombre"      VARCHAR(50)  NOT NULL,
  "etiqueta"    VARCHAR(100) NOT NULL,
  "descripcion" VARCHAR(255),
  "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "updated_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT "enum_categorias_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "enum_categorias_nombre_key" UNIQUE ("nombre")
);

-- 2. Create enum_valores table
CREATE TABLE "enum_valores" (
  "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
  "categoria_id" UUID        NOT NULL,
  "codigo"       VARCHAR(50) NOT NULL,
  "etiqueta"     VARCHAR(100) NOT NULL,
  "activo"       BOOLEAN     NOT NULL DEFAULT true,
  "orden"        INTEGER     NOT NULL DEFAULT 0,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "enum_valores_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "enum_valores_categoria_id_codigo_key" UNIQUE ("categoria_id", "codigo"),
  CONSTRAINT "enum_valores_categoria_id_fkey" FOREIGN KEY ("categoria_id")
    REFERENCES "enum_categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 3. Seed enum_categorias (4 configurables)
INSERT INTO "enum_categorias" ("nombre", "etiqueta", "descripcion") VALUES
  ('EstadoNota',    'Estado de Nota',      'Escala de calificaciones usada en notas de inscripciones'),
  ('TipoNotaFinal', 'Tipo de Nota Final',  'Tipos de evaluación asignables a una inscripción'),
  ('TipoSesion',    'Tipo de Sesión',      'Clasificación de las sesiones de clase'),
  ('MotivoBaja',    'Motivo de Baja',      'Razón por la que un miembro fue dado de baja');

-- 4. Seed enum_valores (16 valores iniciales)
INSERT INTO "enum_valores" ("categoria_id", "codigo", "etiqueta", "activo", "orden")
SELECT c.id, v.codigo, v.etiqueta, true, v.orden
FROM (
  VALUES
    ('EstadoNota',    'Sobresaliente',   'Sobresaliente',    1),
    ('EstadoNota',    'Solido',          'Sólido',           2),
    ('EstadoNota',    'Aprobado',        'Aprobado',         3),
    ('EstadoNota',    'Reprobado',       'Reprobado',        4),
    ('TipoNotaFinal', 'Nota_Teorica',    'Nota Teórica',     1),
    ('TipoNotaFinal', 'Nota_Practica',   'Nota Práctica',    2),
    ('TipoNotaFinal', 'Examen_Final',    'Examen Final',     3),
    ('TipoNotaFinal', 'Trabajo_Escrito', 'Trabajo Escrito',  4),
    ('TipoSesion',    'Clase',           'Clase',            1),
    ('TipoSesion',    'Examen',          'Examen',           2),
    ('TipoSesion',    'Practica',        'Práctica',         3),
    ('TipoSesion',    'Repaso',          'Repaso',           4),
    ('MotivoBaja',    'Ausencia',        'Ausencia',         1),
    ('MotivoBaja',    'Laboral',         'Laboral',          2),
    ('MotivoBaja',    'Personal',        'Personal',         3),
    ('MotivoBaja',    'Desconocido',     'Desconocido',      4)
) AS v(cat_nombre, codigo, etiqueta, orden)
JOIN "enum_categorias" c ON c.nombre = v.cat_nombre;

-- 5. Alter columns: convert enum types to VARCHAR(50)
ALTER TABLE "sesiones"
  ALTER COLUMN "tipo" TYPE VARCHAR(50) USING "tipo"::text;

ALTER TABLE "inscripciones"
  ALTER COLUMN "motivo_baja" TYPE VARCHAR(50) USING "motivo_baja"::text;

ALTER TABLE "notas"
  ALTER COLUMN "nota" TYPE VARCHAR(50) USING "nota"::text;

ALTER TABLE "notas_finales_inscripcion"
  ALTER COLUMN "tipo_nota" TYPE VARCHAR(50) USING "tipo_nota"::text,
  ALTER COLUMN "valor"     TYPE VARCHAR(50) USING "valor"::text;

-- 6. Drop the now-unused PostgreSQL enum types
DROP TYPE "TipoSesion";
DROP TYPE "EstadoNota";
DROP TYPE "TipoNotaFinal";
DROP TYPE "MotivoBaja";
