import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

export async function PATCH(req: NextRequest, { params }: { params: { id: string; inscripcionId: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const dto = await req.json();

    const inscripcion = await prisma.inscripciones.findFirst({ where: { id: params.inscripcionId, clase_id: params.id } });
    if (!inscripcion) throw new ApiError('Inscripción no encontrada', 404);

    const updated = await prisma.inscripciones.update({
      where: { id: params.inscripcionId },
      data: { estado: 'Baja', fecha_baja: new Date(), motivo_baja: dto.motivo_baja, comentarios: dto.comentarios },
    });

    await auditLog({ usuario_id: actor.sub, accion: 'UPDATE', tabla_afectada: 'inscripciones', valor_anterior: { id: params.inscripcionId, estado: inscripcion.estado }, valor_nuevo: { id: params.inscripcionId, estado: 'Baja', motivo: dto.motivo_baja } });
    return json(updated);
  } catch (e) { return handleError(e); }
}
