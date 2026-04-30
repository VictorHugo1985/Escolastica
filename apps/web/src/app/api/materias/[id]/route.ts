import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    const materia = await prisma.materias.findUnique({ where: { id: params.id }, include: { temas: { where: { estado: 'Activo' }, orderBy: { orden: 'asc' } } } });
    if (!materia) throw new ApiError('Materia no encontrada', 404);
    return json(materia);
  } catch (e) { return handleError(e); }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const data = await req.json();
    const before = await prisma.materias.findUnique({ where: { id: params.id } });
    if (!before) throw new ApiError('Materia no encontrada', 404);

    if (data.nombre && data.nombre !== before.nombre) {
      const dup = await prisma.materias.findFirst({ where: { nombre: { equals: data.nombre, mode: 'insensitive' }, NOT: { id: params.id } } });
      if (dup) throw new ApiError(`Ya existe una materia con ese nombre`, 409);
    }

    const updated = await prisma.materias.update({ where: { id: params.id }, data });
    await auditLog({ usuario_id: actor.sub, accion: 'UPDATE', tabla_afectada: 'materias', valor_anterior: { id: params.id, nombre: before.nombre }, valor_nuevo: { id: params.id, nombre: updated.nombre } });
    return json(updated);
  } catch (e) { return handleError(e); }
}
