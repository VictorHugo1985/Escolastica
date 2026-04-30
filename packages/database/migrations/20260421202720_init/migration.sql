-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('Escolastico', 'Instructor', 'Miembro', 'Probacionista', 'ExMiembro');

-- CreateEnum
CREATE TYPE "EstadoGeneral" AS ENUM ('Activo', 'Inactivo');

-- CreateEnum
CREATE TYPE "EstadoClase" AS ENUM ('Activa', 'Inactiva', 'Finalizada');

-- CreateEnum
CREATE TYPE "EstadoInscripcion" AS ENUM ('Activo', 'Baja', 'Finalizado');

-- CreateEnum
CREATE TYPE "EstadoAsistencia" AS ENUM ('Presente', 'Ausente', 'Licencia');

-- CreateEnum
CREATE TYPE "EstadoNota" AS ENUM ('Sobresaliente', 'Solido', 'Aprobado', 'Reprobado');

-- CreateEnum
CREATE TYPE "TipoSesion" AS ENUM ('Clase', 'Examen', 'Practica', 'Repaso');

-- CreateEnum
CREATE TYPE "MotivoBaja" AS ENUM ('Ausencia', 'Laboral', 'Personal', 'Desconocido');

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "rol_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "nombre_completo" VARCHAR(255) NOT NULL,
    "genero" VARCHAR(20),
    "fecha_nacimiento" DATE,
    "telefono" VARCHAR(20),
    "ci" VARCHAR(20),
    "foto_url" TEXT,
    "fecha_recibimiento" DATE,
    "estado" "EstadoGeneral" NOT NULL DEFAULT 'Activo',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materias" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "es_curso_probacion" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoGeneral" NOT NULL DEFAULT 'Activo',
    "nivel" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "materia_id" UUID NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL,
    "estado" "EstadoGeneral" NOT NULL DEFAULT 'Activo',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aulas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(50) NOT NULL,
    "capacidad" INTEGER,
    "ubicacion" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aulas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clase_id" UUID NOT NULL,
    "aula_id" UUID,
    "dia_semana" INTEGER NOT NULL,
    "hora_inicio" TIME NOT NULL,
    "hora_fin" TIME NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "horarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "materia_id" UUID NOT NULL,
    "instructor_id" UUID NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "mes_inicio" INTEGER NOT NULL,
    "anio_inicio" INTEGER NOT NULL,
    "celador" VARCHAR(50) NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "estado" "EstadoClase" NOT NULL DEFAULT 'Activa',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clase_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" "TipoSesion" NOT NULL,
    "tema_id" UUID,
    "comentarios" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscripciones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "clase_id" UUID NOT NULL,
    "fecha_inscripcion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_baja" TIMESTAMPTZ(6),
    "motivo_baja" "MotivoBaja",
    "estado" "EstadoInscripcion" NOT NULL DEFAULT 'Activo',
    "concluyo_temario_materia" BOOLEAN NOT NULL DEFAULT false,
    "fecha_conclusion_temario" DATE,
    "comentarios" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asistencias" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inscripcion_id" UUID NOT NULL,
    "sesion_id" UUID NOT NULL,
    "estado" "EstadoAsistencia" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asistencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inscripcion_id" UUID NOT NULL,
    "nota" "EstadoNota" NOT NULL,
    "tipo_evaluacion" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID,
    "accion" VARCHAR(100) NOT NULL,
    "tabla_afectada" VARCHAR(100) NOT NULL,
    "valor_anterior" JSONB,
    "valor_nuevo" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "aulas_nombre_key" ON "aulas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "clases_codigo_key" ON "clases"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "inscripciones_usuario_id_clase_id_key" ON "inscripciones"("usuario_id", "clase_id");

-- CreateIndex
CREATE UNIQUE INDEX "asistencias_inscripcion_id_sesion_id_key" ON "asistencias"("inscripcion_id", "sesion_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temas" ADD CONSTRAINT "temas_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios" ADD CONSTRAINT "horarios_aula_id_fkey" FOREIGN KEY ("aula_id") REFERENCES "aulas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios" ADD CONSTRAINT "horarios_clase_id_fkey" FOREIGN KEY ("clase_id") REFERENCES "clases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clases" ADD CONSTRAINT "clases_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clases" ADD CONSTRAINT "clases_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_clase_id_fkey" FOREIGN KEY ("clase_id") REFERENCES "clases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_tema_id_fkey" FOREIGN KEY ("tema_id") REFERENCES "temas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_clase_id_fkey" FOREIGN KEY ("clase_id") REFERENCES "clases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_inscripcion_id_fkey" FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "sesiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_inscripcion_id_fkey" FOREIGN KEY ("inscripcion_id") REFERENCES "inscripciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
