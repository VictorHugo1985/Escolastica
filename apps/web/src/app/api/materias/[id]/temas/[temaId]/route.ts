import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

export async function PATCH(req: NextRequest, { params }: { params: { id: string; temaId: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const data = await req.json();
    const before = await prisma.temas.findFirst({ where: { id: params.temaId, materia_id: params.id } });
    if (!before) throw new ApiError('Tema no encontrado', 404);
    const updated = await prisma.temas.update({ where: { id: params.temaId }, data });
    await auditLog({ usuario_id: actor.sub, accion: 'UPDATE', tabla_afectada: 'temas', valor_anterior: { id: params.temaId, titulo: before.titulo }, valor_nuevo: { id: params.temaId, titulo: updated.titulo } });
    return json(updated);
  } catch (e) { return handleError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; temaId: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const before = await prisma.temas.findFirst({ where: { id: params.temaId, materia_id: params.id } });
    if (!before) throw new ApiError('Tema no encontrado', 404);
    await prisma.temas.update({ where: { id: params.temaId }, data: { estado: 'Inactivo' } });
    await auditLog({ usuario_id: actor.sub, accion: 'DELETE', tabla_afectada: 'temas', valor_anterior: { id: params.temaId, titulo: before.titulo } });
    return json({}, 204);
  } catch (e) { return handleError(e); }
}
