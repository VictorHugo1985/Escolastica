import { z } from 'zod';

// Acepta "", null o undefined como "sin valor". Solo valida formato si el valor es no-vacío.
const optRef = (schema: z.ZodTypeAny) =>
  z.string().optional().nullable().superRefine((v, ctx) => {
    if (!v) return;
    const result = schema.safeParse(v);
    if (!result.success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.error.errors[0]?.message ?? 'Valor inválido' });
    }
  });

export const CreateUserSchema = z.object({
  email:             z.string().optional(),
  nombre_completo:   z.string().min(2).max(255),
  genero:            z.string().max(20).optional(),
  fecha_nacimiento:  optRef(z.string().date('Fecha inválida')),
  telefono:          z.string().optional(),
  ci:                z.string().max(20).optional(),
  file_actualizado:  z.boolean().optional(),
  fecha_inscripcion: optRef(z.string().date('Fecha inválida')),
  fecha_recibimiento: optRef(z.string().date('Fecha inválida')),
});


export const UpdateUserSchema = CreateUserSchema.partial().extend({
  estado: z.enum(['Activo', 'Inactivo']).optional(),
});

export const AddRoleSchema = z.object({
  rol: z.enum(['Escolastico', 'Instructor', 'Miembro', 'Probacionista', 'ExProbacionista', 'ExMiembro']),
});

export const UpdateInterviewSchema = z.object({
  fecha_entrevista:       z.string().date().nullable().optional(),
  entrevista_completada:  z.boolean().optional(),
});

export const ChangePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export type CreateUserDto      = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto      = z.infer<typeof UpdateUserSchema>;
export type AddRoleDto         = z.infer<typeof AddRoleSchema>;
export type ChangePasswordDto  = z.infer<typeof ChangePasswordSchema>;
export type UpdateInterviewDto = z.infer<typeof UpdateInterviewSchema>;

export interface FilaImportacionResultado {
  fila_numero: number;
  nombre: string;
  email: string;
  resultado: 'creado' | 'duplicado' | 'error';
  motivo?: string;
}

export interface ImportResultDto {
  total: number;
  creados: number;
  duplicados: number;
  errores: number;
  filas_fallidas: FilaImportacionResultado[];
}

export interface ImportCoincidencia {
  fuente: 'csv' | 'bd';
  nombre_similar: string;
  similitud: number; // 0-100
  fila_csv?: number;
  id?: string;
}

export interface ImportAdvertencia {
  fila_numero: number;
  nombre: string;
  coincidencias: ImportCoincidencia[];
}

export interface ImportPreviewDto {
  total: number;
  sin_advertencias: number;
  advertencias: ImportAdvertencia[];
}
