import { z } from 'zod';
export declare const CreateHorarioSchema: z.ZodObject<{
    dia_semana: z.ZodNumber;
    hora_inicio: z.ZodString;
    hora_fin: z.ZodString;
    aula_id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    dia_semana: number;
    hora_inicio: string;
    hora_fin: string;
    aula_id?: string | undefined;
}, {
    dia_semana: number;
    hora_inicio: string;
    hora_fin: string;
    aula_id?: string | undefined;
}>;
export type CreateHorarioDto = z.infer<typeof CreateHorarioSchema>;
