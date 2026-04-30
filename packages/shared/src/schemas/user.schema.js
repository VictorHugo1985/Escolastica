"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangePasswordSchema = exports.AssignRoleSchema = exports.UpdateUserSchema = exports.CreateUserSchema = void 0;
const zod_1 = require("zod");
exports.CreateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    nombre_completo: zod_1.z.string().min(2).max(255),
    genero: zod_1.z.string().max(20).optional(),
    fecha_nacimiento: zod_1.z.string().date().optional(),
    telefono: zod_1.z.string().regex(/^\d{8,10}$/, 'Teléfono debe tener entre 8 y 10 dígitos').optional(),
    ci: zod_1.z.string().max(20).optional(),
    foto_url: zod_1.z.string().url().optional(),
    fecha_recibimiento: zod_1.z.string().date().optional(),
});
exports.UpdateUserSchema = exports.CreateUserSchema.partial().omit({ email: true });
exports.AssignRoleSchema = zod_1.z.object({
    rol: zod_1.z.enum(['Escolastico', 'Instructor', 'Miembro', 'Probacionista', 'ExMiembro']),
});
exports.ChangePasswordSchema = zod_1.z.object({
    current_password: zod_1.z.string().min(8),
    new_password: zod_1.z
        .string()
        .min(8)
        .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/, 'Requiere mayúscula, número y símbolo'),
});
//# sourceMappingURL=user.schema.js.map