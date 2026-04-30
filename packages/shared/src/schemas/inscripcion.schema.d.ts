import { z } from 'zod';
export declare const CreateInscripcionSchema: z.ZodObject<{
    usuario_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    usuario_id: string;
}, {
    usuario_id: string;
}>;
export declare const BajaInscripcionSchema: z.ZodObject<{
    motivo_baja: z.ZodEnum<["Ausencia", "Laboral", "Personal", "Desconocido"]>;
    comentarios: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    motivo_baja: "Ausencia" | "Laboral" | "Personal" | "Desconocido";
    comentarios?: string | undefined;
}, {
    motivo_baja: "Ausencia" | "Laboral" | "Personal" | "Desconocido";
    comentarios?: string | undefined;
}>;
export type CreateInscripcionDto = z.infer<typeof CreateInscripcionSchema>;
export type BajaInscripcionDto = z.infer<typeof BajaInscripcionSchema>;
