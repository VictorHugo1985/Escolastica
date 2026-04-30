import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const { estado } = await req.json();
    const before = await prisma.clases.findUnique({ where: { id: params.id } });
    if (!before) throw new ApiError('Clase no encontrada', 404);
    const updated = await prisma.clases.update({ where: { id: params.id }, data: { estado } });
    await auditLog({ usuario_id: actor.sub, accion: 'UPDATE', tabla_afectada: 'clases', valor_anterior: { id: params.id, estado: before.estado }, valor_nuevo: { id: params.id, estado } });
    return json(updated);
  } catch (e) { return handleError(e); }
}
