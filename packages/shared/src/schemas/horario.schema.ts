import { z } from 'zod';

export const CreateHorarioSchema = z.object({
  dia_semana: z.number().int().min(0).max(6),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/),
  hora_fin: z.string().regex(/^\d{2}:\d{2}$/),
  aula_id: z.string().uuid().optional(),
});

export type CreateHorarioDto = z.infer<typeof CreateHorarioSchema>;
