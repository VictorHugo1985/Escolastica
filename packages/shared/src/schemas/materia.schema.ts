import { z } from 'zod';

export const CreateMateriaSchema = z.object({
  nombre: z.string().min(1).max(100),
  descripcion: z.string().optional(),
  nivel: z.number().int().min(0),
  es_curso_probacion: z.boolean().optional().default(false),
});

export const UpdateMateriaSchema = CreateMateriaSchema.partial();

export type CreateMateriaDto = z.infer<typeof CreateMateriaSchema>;
export type UpdateMateriaDto = z.infer<typeof UpdateMateriaSchema>;
