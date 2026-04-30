import { z } from 'zod';

export const CreateClaseSchema = z.object({
  materia_id: z.string().uuid(),
  instructor_id: z.string().uuid(),
  mes_inicio: z.coerce.number().int().min(1).max(12),
  anio_inicio: z.coerce.number().int().min(2000),
  celador: z.string().min(1).max(50),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paralelo: z.string().max(5).optional(),
  horario: z.object({
    dia_semana: z.coerce.number().int().min(0).max(6),
    hora_inicio: z.string().regex(/^\d{2}:\d{2}$/),
    hora_fin: z.string().regex(/^\d{2}:\d{2}$/),
    aula_id: z.string().uuid().optional(),
  }),
});

export const UpdateClaseSchema = z.object({
  materia_id: z.string().uuid().optional(),
  instructor_id: z.string().uuid().optional(),
  mes_inicio: z.number().int().min(1).max(12).optional(),
  anio_inicio: z.number().int().min(2000).optional(),
  celador: z.string().min(1).max(50).optional(),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  paralelo: z.string().max(5).optional(),
  comentarios: z.string().max(1000).nullable().optional(),
});

export const ChangeClaseStatusSchema = z.object({
  estado: z.enum(['Activa', 'Inactiva', 'Finalizada']),
});

export type CreateClaseDto = z.infer<typeof CreateClaseSchema>;
export type UpdateClaseDto = z.infer<typeof UpdateClaseSchema>;
export type ChangeClaseStatusDto = z.infer<typeof ChangeClaseStatusSchema>;
