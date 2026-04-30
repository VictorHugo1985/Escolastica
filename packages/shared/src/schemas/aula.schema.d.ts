import { z } from 'zod';
export declare const CreateAulaSchema: z.ZodObject<{
    nombre: z.ZodString;
    capacidad: z.ZodOptional<z.ZodNumber>;
    ubicacion: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    nombre: string;
    capacidad?: number | undefined;
    ubicacion?: string | undefined;
}, {
    nombre: string;
    capacidad?: number | undefined;
    ubicacion?: string | undefined;
}>;
export declare const UpdateAulaSchema: z.ZodObject<{
    nombre: z.ZodOptional<z.ZodString>;
    capacidad: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    ubicacion: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    nombre?: string | undefined;
    capacidad?: number | undefined;
    ubicacion?: string | undefined;
}, {
    nombre?: string | undefined;
    capacidad?: number | undefined;
    ubicacion?: string | undefined;
}>;
export type CreateAulaDto = z.infer<typeof CreateAulaSchema>;
export type UpdateAulaDto = z.infer<typeof UpdateAulaSchema>;
