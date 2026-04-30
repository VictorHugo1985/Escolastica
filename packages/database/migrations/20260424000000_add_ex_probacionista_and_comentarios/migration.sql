-- Migration: add ExProbacionista to Rol enum and comentarios to usuarios
-- Spec: 023-roles-ajustes-mvp

-- Step 1: Add new value to Rol enum
ALTER TYPE "Rol" ADD VALUE IF NOT EXISTS 'ExProbacionista';

-- Step 2: Add comentarios field to usuarios table
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "comentarios" TEXT;
