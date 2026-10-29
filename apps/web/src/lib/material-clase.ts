import type { ZodType } from 'zod';
import { prisma } from './prisma';
import { ApiError, requireRole, type JwtPayload } from './route';

// Instructor solo en sus clases; Escolástico en todas. Clases Inactiva excluidas (spec 032 FR-008/FR-009)
export async function assertAccesoMaterial(actor: JwtPayload, claseId: string) {
  requireRole(actor, 'Instructor', 'Escolastico');
  const clase = await prisma.clases.findUnique({
    where: { id: claseId },
    select: { id: true, materia_id: true, instructor_id: true, estado: true },
  });
  if (!clase) throw new ApiError('Clase no encontrada', 404);
  if (clase.estado === 'Inactiva') throw new ApiError('La clase está inactiva', 409);
  if (!actor.roles.includes('Escolastico') && clase.instructor_id !== actor.sub) {
    throw new ApiError('Sin permisos suficientes', 403);
  }
  return clase;
}

export function parseBody<T>(schema: ZodType<T, any, any>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ApiError(result.error.issues.map((i) => i.message).join(', '), 400);
  }
  return result.data;
}

export async function assertTemasDeMateria(temaIds: string[], materiaId: string) {
  if (temaIds.length === 0) return;
  const count = await prisma.temas.count({ where: { id: { in: temaIds }, materia_id: materiaId } });
  if (count !== new Set(temaIds).size) throw new ApiError('Tema no pertenece a la materia', 400);
}

export const pagoInclude = {
  material: { select: { clase_id: true } },
  temas: { include: { tema: { select: { id: true, titulo: true } } } },
  registrador: { select: { id: true, nombre_completo: true } },
} as const;

interface PagoConRelaciones {
  id: string;
  inscripcion_id: string;
  fecha: Date;
  monto: { toNumber(): number } | number;
  comentarios: string | null;
  created_at: Date;
  material: { clase_id: string };
  temas: { tema: { id: string; titulo: string } }[];
  registrador: { id: string; nombre_completo: string } | null;
}

export function serializarPago(pago: PagoConRelaciones) {
  return {
    id: pago.id,
    inscripcion_id: pago.inscripcion_id,
    fecha: pago.fecha.toISOString().split('T')[0],
    monto: Number(pago.monto),
    comentarios: pago.comentarios,
    temas: pago.temas.map((t) => t.tema),
    registrado_por: pago.registrador,
  };
}

export function snapshotPago(pago: PagoConRelaciones) {
  return {
    id: pago.id,
    clase_id: pago.material.clase_id,
    inscripcion_id: pago.inscripcion_id,
    fecha: pago.fecha.toISOString().split('T')[0],
    monto: Number(pago.monto),
    comentarios: pago.comentarios,
    tema_ids: pago.temas.map((t) => t.tema.id),
  };
}
