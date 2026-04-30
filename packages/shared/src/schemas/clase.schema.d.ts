import { z } from 'zod';
export declare const CreateClaseSchema: z.ZodObject<{
    materia_id: z.ZodString;
    instructor_id: z.ZodString;
    mes_inicio: z.ZodNumber;
    anio_inicio: z.ZodNumber;
    celador: z.ZodString;
    fecha_inicio: z.ZodString;
    fecha_fin: z.ZodString;
    paralelo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    materia_id: string;
    instructor_id: string;
    mes_inicio: number;
    anio_inicio: number;
    celador: string;
    fecha_inicio: string;
    fecha_fin: string;
    paralelo?: string | undefined;
}, {
    materia_id: string;
    instructor_id: string;
    mes_inicio: number;
    anio_inicio: number;
    celador: string;
    fecha_inicio: string;
    fecha_fin: string;
    paralelo?: string | undefined;
}>;
export declare const UpdateClaseSchema: z.ZodObject<{
    celador: z.ZodOptional<z.ZodString>;
    fecha_fin: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    celador?: string | undefined;
    fecha_fin?: string | undefined;
}, {
    celador?: string | undefined;
    fecha_fin?: string | undefined;
}>;
export declare const ChangeClaseStatusSchema: z.ZodObject<{
    estado: z.ZodEnum<["Activa", "Inactiva", "Finalizada"]>;
}, "strip", z.ZodTypeAny, {
    estado: "Activa" | "Inactiva" | "Finalizada";
}, {
    estado: "Activa" | "Inactiva" | "Finalizada";
}>;
export type CreateClaseDto = z.infer<typeof CreateClaseSchema>;
export type UpdateClaseDto = z.infer<typeof UpdateClaseSchema>;
export type ChangeClaseStatusDto = z.infer<typeof ChangeClaseStatusSchema>;
