import { z } from 'zod';

export const EstadoNota = z.enum(['Sobresaliente', 'Solido', 'Aprobado', 'Reprobado']);

export const CreateNotaSchema = z.object({
  inscripcion_id: z.string().uuid(),
  nota: EstadoNota,
  tipo_evaluacion: z.string().min(1).max(100),
});

export const UpdateNotaSchema = z.object({
  nota: EstadoNota,
  tipo_evaluacion: z.string().min(1).max(100).optional(),
});

export type CreateNotaDto = z.infer<typeof CreateNotaSchema>;
export type UpdateNotaDto = z.infer<typeof UpdateNotaSchema>;
