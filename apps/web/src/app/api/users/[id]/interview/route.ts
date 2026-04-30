import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const data = await req.json();
    const { id } = params;

    const user = await prisma.usuarios.findUnique({ where: { id }, include: { roles: { include: { rol: true } } } });
    if (!user) throw new ApiError('Usuario no encontrado', 404);
    if (!user.roles.some((r) => r.rol.nombre === 'Probacionista')) throw new ApiError('Solo se puede gestionar la entrevista de Probacionistas', 400);

    const updated = await prisma.usuarios.update({
      where: { id },
      data: {
        ...(data.fecha_entrevista !== undefined && { fecha_entrevista: data.fecha_entrevista ? new Date(data.fecha_entrevista) : null }),
        ...(data.entrevista_completada !== undefined && { entrevista_completada: data.entrevista_completada }),
      },
      include: { roles: { include: { rol: true } } },
    });
    await auditLog({ usuario_id: actor.sub, accion: 'UPDATE', tabla_afectada: 'usuarios', valor_nuevo: { id, fecha_entrevista: updated.fecha_entrevista, entrevista_completada: updated.entrevista_completada } });
    return json(updated);
  } catch (e) { return handleError(e); }
}
