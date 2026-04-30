import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const { id } = params;

    const active = await prisma.clases.count({ where: { instructor_id: id, estado: 'Activa' } });
    if (active > 0) throw new ApiError('No se puede desactivar: el usuario tiene clases activas como instructor', 409);

    const updated = await prisma.usuarios.update({ where: { id }, data: { estado: 'Inactivo' }, include: { roles: { include: { rol: true } } } });
    await auditLog({ usuario_id: actor.sub, accion: 'UPDATE', tabla_afectada: 'usuarios', valor_nuevo: { id, estado: 'Inactivo' } });
    return json(updated);
  } catch (e) { return handleError(e); }
}
