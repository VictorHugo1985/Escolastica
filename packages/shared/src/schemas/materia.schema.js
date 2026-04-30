"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMateriaSchema = exports.CreateMateriaSchema = void 0;
const zod_1 = require("zod");
exports.CreateMateriaSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1).max(100),
    descripcion: zod_1.z.string().optional(),
    nivel: zod_1.z.number().int().min(1),
    es_curso_probacion: zod_1.z.boolean().optional().default(false),
});
exports.UpdateMateriaSchema = exports.CreateMateriaSchema.partial();
//# sourceMappingURL=materia.schema.js.map