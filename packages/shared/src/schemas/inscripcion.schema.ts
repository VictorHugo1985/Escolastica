import { z } from 'zod';

export const CreateInscripcionSchema = z.object({
  usuario_id: z.string().uuid(),
});

export const BajaInscripcionSchema = z.object({
  motivo_baja: z.enum(['Ausencia', 'Laboral', 'Personal', 'Desconocido']),
  comentarios: z.string().optional(),
});

export const ConclusionInscripcionSchema = z.object({
  concluyo_temario_materia: z.boolean(),
  fecha_conclusion_temario: z.string().date().optional(),
  comentarios: z.string().optional(),
});

export type CreateInscripcionDto = z.infer<typeof CreateInscripcionSchema>;
export type BajaInscripcionDto = z.infer<typeof BajaInscripcionSchema>;
export type ConclusionInscripcionDto = z.infer<typeof ConclusionInscripcionSchema>;
