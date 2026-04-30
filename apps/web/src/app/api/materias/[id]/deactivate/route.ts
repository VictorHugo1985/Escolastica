import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const before = await prisma.materias.findUnique({ where: { id: params.id } });
    if (!before) throw new ApiError('Materia no encontrada', 404);
    const updated = await prisma.materias.update({ where: { id: params.id }, data: { estado: 'Inactivo' } });
    await auditLog({ usuario_id: actor.sub, accion: 'UPDATE', tabla_afectada: 'materias', valor_anterior: { id: params.id, estado: before.estado }, valor_nuevo: { id: params.id, estado: 'Inactivo' } });
    return json(updated);
  } catch (e) { return handleError(e); }
}
