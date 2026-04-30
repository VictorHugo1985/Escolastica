import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const { temas } = await req.json();
    const materia = await prisma.materias.findUnique({ where: { id: params.id } });
    if (!materia) throw new ApiError('Materia no encontrada', 404);
    await prisma.$transaction(temas.map(({ id, orden }: { id: string; orden: number }) => prisma.temas.update({ where: { id }, data: { orden } })));
    await auditLog({ usuario_id: actor.sub, accion: 'UPDATE', tabla_afectada: 'temas', valor_nuevo: { materia_id: params.id, reorder: temas } });
    return json(await prisma.temas.findMany({ where: { materia_id: params.id, estado: 'Activo' }, orderBy: { orden: 'asc' } }));
  } catch (e) { return handleError(e); }
}
