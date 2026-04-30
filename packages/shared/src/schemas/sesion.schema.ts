import { z } from 'zod';

export const CreateSesionSchema = z.object({
  clase_id: z.string().uuid(),
  fecha: z.string().date().optional(),
  tipo: z.enum(['Clase', 'Examen', 'Practica', 'Repaso']).optional(),
  tema_id: z.string().uuid().optional(),
  comentarios: z.string().max(500).optional(),
});

export type CreateSesionDto = z.infer<typeof CreateSesionSchema>;

export const UpdateSesionSchema = z.object({
  tipo: z.enum(['Clase', 'Examen', 'Practica', 'Repaso']).optional(),
  tema_id: z.string().uuid().nullable().optional(),
  comentarios: z.string().max(500).nullable().optional(),
  fecha: z.string().date().optional(),
});

export type UpdateSesionDto = z.infer<typeof UpdateSesionSchema>;
