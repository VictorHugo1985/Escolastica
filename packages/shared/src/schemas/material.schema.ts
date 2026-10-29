import { z } from 'zod';

// Monto de un pago de material: >= 0 y como máximo un decimal (DECIMAL(8,1) en BD)
export const MontoSchema = z
  .number({ invalid_type_error: 'El monto debe ser un número' })
  .min(0, 'El monto no puede ser negativo')
  .max(9999999.9, 'El monto es demasiado grande')
  .refine((v) => Math.abs(v * 10 - Math.round(v * 10)) < 1e-9, 'El monto admite como máximo un decimal');

export const CreatePagoMaterialSchema = z.object({
  inscripcion_id: z.string().uuid(),
  fecha: z.string().date(),
  monto: MontoSchema,
  tema_ids: z.array(z.string().uuid()).default([]),
  comentarios: z.string().max(500).nullable().optional(),
});

export type CreatePagoMaterialDto = z.infer<typeof CreatePagoMaterialSchema>;

export const UpdatePagoMaterialSchema = z.object({
  fecha: z.string().date().optional(),
  monto: MontoSchema.optional(),
  tema_ids: z.array(z.string().uuid()).optional(),
  comentarios: z.string().max(500).nullable().optional(),
});

export type UpdatePagoMaterialDto = z.infer<typeof UpdatePagoMaterialSchema>;

export const UpdateMaterialClaseSchema = z.object({
  comentarios: z.string().max(1000).nullable(),
});

export type UpdateMaterialClaseDto = z.infer<typeof UpdateMaterialClaseSchema>;
