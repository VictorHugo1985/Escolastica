"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateHorarioSchema = void 0;
const zod_1 = require("zod");
exports.CreateHorarioSchema = zod_1.z.object({
    dia_semana: zod_1.z.number().int().min(0).max(6),
    hora_inicio: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
    hora_fin: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
    aula_id: zod_1.z.string().uuid().optional(),
});
//# sourceMappingURL=horario.schema.js.map