import { z } from 'zod';
export declare const CreateMateriaSchema: z.ZodObject<{
    nombre: z.ZodString;
    descripcion: z.ZodOptional<z.ZodString>;
    nivel: z.ZodNumber;
    es_curso_probacion: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    nombre: string;
    nivel: number;
    es_curso_probacion: boolean;
    descripcion?: string | undefined;
}, {
    nombre: string;
    nivel: number;
    descripcion?: string | undefined;
    es_curso_probacion?: boolean | undefined;
}>;
export declare const UpdateMateriaSchema: z.ZodObject<{
    nombre: z.ZodOptional<z.ZodString>;
    descripcion: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    nivel: z.ZodOptional<z.ZodNumber>;
    es_curso_probacion: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
}, "strip", z.ZodTypeAny, {
    nombre?: string | undefined;
    descripcion?: string | undefined;
    nivel?: number | undefined;
    es_curso_probacion?: boolean | undefined;
}, {
    nombre?: string | undefined;
    descripcion?: string | undefined;
    nivel?: number | undefined;
    es_curso_probacion?: boolean | undefined;
}>;
export type CreateMateriaDto = z.infer<typeof CreateMateriaSchema>;
export type UpdateMateriaDto = z.infer<typeof UpdateMateriaSchema>;
