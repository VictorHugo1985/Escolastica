import { z } from 'zod';
export declare const CreateUserSchema: z.ZodObject<{
    email: z.ZodString;
    nombre_completo: z.ZodString;
    genero: z.ZodOptional<z.ZodString>;
    fecha_nacimiento: z.ZodOptional<z.ZodString>;
    telefono: z.ZodOptional<z.ZodString>;
    ci: z.ZodOptional<z.ZodString>;
    foto_url: z.ZodOptional<z.ZodString>;
    fecha_recibimiento: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    nombre_completo: string;
    genero?: string | undefined;
    fecha_nacimiento?: string | undefined;
    telefono?: string | undefined;
    ci?: string | undefined;
    foto_url?: string | undefined;
    fecha_recibimiento?: string | undefined;
}, {
    email: string;
    nombre_completo: string;
    genero?: string | undefined;
    fecha_nacimiento?: string | undefined;
    telefono?: string | undefined;
    ci?: string | undefined;
    foto_url?: string | undefined;
    fecha_recibimiento?: string | undefined;
}>;
export declare const UpdateUserSchema: z.ZodObject<Omit<{
    email: z.ZodOptional<z.ZodString>;
    nombre_completo: z.ZodOptional<z.ZodString>;
    genero: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    fecha_nacimiento: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    telefono: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    ci: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    foto_url: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    fecha_recibimiento: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "email">, "strip", z.ZodTypeAny, {
    nombre_completo?: string | undefined;
    genero?: string | undefined;
    fecha_nacimiento?: string | undefined;
    telefono?: string | undefined;
    ci?: string | undefined;
    foto_url?: string | undefined;
    fecha_recibimiento?: string | undefined;
}, {
    nombre_completo?: string | undefined;
    genero?: string | undefined;
    fecha_nacimiento?: string | undefined;
    telefono?: string | undefined;
    ci?: string | undefined;
    foto_url?: string | undefined;
    fecha_recibimiento?: string | undefined;
}>;
export declare const AssignRoleSchema: z.ZodObject<{
    rol: z.ZodEnum<["Escolastico", "Instructor", "Miembro", "Probacionista", "ExMiembro"]>;
}, "strip", z.ZodTypeAny, {
    rol: "Escolastico" | "Instructor" | "Miembro" | "Probacionista" | "ExMiembro";
}, {
    rol: "Escolastico" | "Instructor" | "Miembro" | "Probacionista" | "ExMiembro";
}>;
export declare const ChangePasswordSchema: z.ZodObject<{
    current_password: z.ZodString;
    new_password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    current_password: string;
    new_password: string;
}, {
    current_password: string;
    new_password: string;
}>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type AssignRoleDto = z.infer<typeof AssignRoleSchema>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
