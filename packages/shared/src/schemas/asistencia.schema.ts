import { z } from 'zod';

const EstadoAsistencia = z.enum(['Presente', 'Ausente', 'Licencia']);

export const AsistenciaItemSchema = z.object({
  inscripcion_id: z.string().uuid(),
  estado: EstadoAsistencia,
});

export const BulkAsistenciaSchema = z.object({
  asistencias: z.array(AsistenciaItemSchema),
});

export const UpdateAsistenciaSchema = z.object({
  estado: EstadoAsistencia,
});

export type BulkAsistenciaDto = z.infer<typeof BulkAsistenciaSchema>;
export type UpdateAsistenciaDto = z.infer<typeof UpdateAsistenciaSchema>;
