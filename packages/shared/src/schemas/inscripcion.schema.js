"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BajaInscripcionSchema = exports.CreateInscripcionSchema = void 0;
const zod_1 = require("zod");
exports.CreateInscripcionSchema = zod_1.z.object({
    usuario_id: zod_1.z.string().uuid(),
});
exports.BajaInscripcionSchema = zod_1.z.object({
    motivo_baja: zod_1.z.enum(['Ausencia', 'Laboral', 'Personal', 'Desconocido']),
    comentarios: zod_1.z.string().optional(),
});
//# sourceMappingURL=inscripcion.schema.js.map