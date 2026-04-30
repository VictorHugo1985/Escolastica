import { z } from 'zod';

// Convierte "" y null a undefined antes de validar, para que campos opcionales
// del form (que envían "" cuando están vacíos) pasen sin error de formato.
const optRef = (schema: z.ZodTypeAny) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : v), schema.optional());

export const CreateUserSchema = z.object({
  email:             optRef(z.string().email('Email inválido')),
  nombre_completo:   z.string().min(2).max(255),
  genero:            z.string().max(20).optional(),
  fecha_nacimiento:  optRef(z.string().date('Fecha inválida')),
  telefono:          optRef(z.string().regex(/^\d{7,15}$/, 'Teléfono debe tener entre 7 y 15 dígitos')),
  ci:                z.string().max(20).optional(),
  foto_url:          optRef(z.string().url('URL inválida')),
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
  current_password: z.string().min(8),
  new_password: z
    .string()
    .min(8)
    .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/, 'Requiere mayúscula, número y símbolo'),
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
