-- Migration: add comentarios field to clases table
ALTER TABLE "clases" ADD COLUMN IF NOT EXISTS "comentarios" TEXT;
