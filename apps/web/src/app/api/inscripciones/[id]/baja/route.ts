import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const dto = await req.json();

    const before = await prisma.inscripciones.findUnique({ where: { id: params.id } });
    if (!before) throw new ApiError('Inscripción no encontrada', 404);
    if (before.estado !== 'Activo') throw new ApiError(`No se puede dar de baja una inscripción con estado '${before.estado}'`, 409);

    const updated = await prisma.inscripciones.update({
      where: { id: params.id },
      data: { estado: 'Baja', fecha_baja: new Date(), motivo_baja: dto.motivo_baja, comentarios: dto.comentarios },
    });

    await auditLog({ usuario_id: actor.sub, accion: 'UPDATE', tabla_afectada: 'inscripciones', valor_anterior: { id: params.id, estado: before.estado }, valor_nuevo: { id: params.id, estado: 'Baja', motivo: dto.motivo_baja } });
    return json(updated);
  } catch (e) { return handleError(e); }
}
