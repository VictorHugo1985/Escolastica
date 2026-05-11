import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, json, handleError, ApiError } from '@/lib/route';

export async function DELETE(req: NextRequest, { params }: { params: { id: string; notaId: string } }) {
  try {
    const actor = await requireAuth(req);

    const inscripcion = await prisma.inscripciones.findUnique({
      where: { id: params.id },
      include: { clase: { select: { instructor_id: true } } },
    });
    if (!inscripcion) throw new ApiError('Inscripción no encontrada', 404);

    const esEscol = actor.roles.includes('Escolastico');
    const esInstructor = inscripcion.clase.instructor_id === actor.sub;
    if (!esEscol && !esInstructor) throw new ApiError('Solo el instructor titular o un Escolástico puede eliminar notas finales', 403);

    const nota = await prisma.notas_finales_inscripcion.findUnique({ where: { id: params.notaId } });
    if (!nota || nota.inscripcion_id !== params.id) throw new ApiError('Nota no encontrada', 404);

    await auditLog({
      usuario_id: actor.sub,
      accion: 'DELETE',
      tabla_afectada: 'notas_finales_inscripcion',
      valor_anterior: { id: nota.id, inscripcion_id: nota.inscripcion_id, tipo_nota: nota.tipo_nota, valor: nota.valor },
      valor_nuevo: null,
    });

    await prisma.notas_finales_inscripcion.delete({ where: { id: params.notaId } });

    return new Response(null, { status: 204 });
  } catch (e) { return handleError(e); }
}
