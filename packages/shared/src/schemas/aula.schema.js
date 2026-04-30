"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAulaSchema = exports.CreateAulaSchema = void 0;
const zod_1 = require("zod");
exports.CreateAulaSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1).max(50),
    capacidad: zod_1.z.number().int().positive().optional(),
    ubicacion: zod_1.z.string().optional(),
});
exports.UpdateAulaSchema = exports.CreateAulaSchema.partial();
//# sourceMappingURL=aula.schema.js.map