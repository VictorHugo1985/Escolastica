import { z } from 'zod';

export const CreateAulaSchema = z.object({
  nombre: z.string().min(1).max(50),
  capacidad: z.number().int().positive().optional(),
  ubicacion: z.string().optional(),
});

export const UpdateAulaSchema = CreateAulaSchema.partial();

export type CreateAulaDto = z.infer<typeof CreateAulaSchema>;
export type UpdateAulaDto = z.infer<typeof UpdateAulaSchema>;
