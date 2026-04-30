"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeClaseStatusSchema = exports.UpdateClaseSchema = exports.CreateClaseSchema = void 0;
const zod_1 = require("zod");
exports.CreateClaseSchema = zod_1.z.object({
    materia_id: zod_1.z.string().uuid(),
    instructor_id: zod_1.z.string().uuid(),
    mes_inicio: zod_1.z.number().int().min(1).max(12),
    anio_inicio: zod_1.z.number().int().min(2000),
    celador: zod_1.z.string().min(1).max(50),
    fecha_inicio: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    fecha_fin: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    paralelo: zod_1.z.string().max(5).optional(),
});
exports.UpdateClaseSchema = zod_1.z.object({
    celador: zod_1.z.string().min(1).max(50).optional(),
    fecha_fin: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
exports.ChangeClaseStatusSchema = zod_1.z.object({
    estado: zod_1.z.enum(['Activa', 'Inactiva', 'Finalizada']),
});
//# sourceMappingURL=clase.schema.js.map