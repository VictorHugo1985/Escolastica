import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, handleError } from '@/lib/route';

export async function GET(req: NextRequest, { params }: { params: { id: string; sesionId: string } }) {
  try {
    await requireAuth(req);
    const inscripciones = await prisma.inscripciones.findMany({
      where: { clase_id: params.id, estado: 'Activo' },
      include: {
        usuario: { select: { id: true, nombre_completo: true } },
        asistencias: { where: { sesion_id: params.sesionId } },
      },
    });
    return json(inscripciones.map((insc) => ({
      inscripcion_id: insc.id,
      usuario: insc.usuario,
      estado: insc.asistencias[0]?.estado ?? 'Ausente',
      asistencia_id: insc.asistencias[0]?.id ?? null,
    })));
  } catch (e) { return handleError(e); }
}
