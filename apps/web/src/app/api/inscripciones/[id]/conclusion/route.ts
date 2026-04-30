import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, json, handleError, ApiError } from '@/lib/route';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    const dto = await req.json();

    const before = await prisma.inscripciones.findUnique({
      where: { id: params.id },
      include: { clase: { select: { instructor_id: true } } },
    });
    if (!before) throw new ApiError('Inscripción no encontrada', 404);

    const esEscol = actor.roles.includes('Escolastico');
    const esInstructor = before.clase.instructor_id === actor.sub;
    if (!esEscol && !esInstructor) throw new ApiError('Solo el instructor titular o un Escolástico puede marcar la conclusión', 403);

    const updated = await prisma.inscripciones.update({
      where: { id: params.id },
      data: {
        concluyo_temario_materia: dto.concluyo_temario_materia,
        fecha_conclusion_temario: dto.fecha_conclusion_temario
          ? new Date(dto.fecha_conclusion_temario)
          : dto.concluyo_temario_materia ? new Date() : null,
        ...(dto.comentarios !== undefined && { comentarios: dto.comentarios }),
      },
    });

    await auditLog({ usuario_id: actor.sub, accion: 'UPDATE', tabla_afectada: 'inscripciones', valor_anterior: { id: params.id, concluyo_temario_materia: before.concluyo_temario_materia }, valor_nuevo: { id: params.id, concluyo_temario_materia: dto.concluyo_temario_materia } });
    return json(updated);
  } catch (e) { return handleError(e); }
}
