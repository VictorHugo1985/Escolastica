import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, handleError } from '@/lib/route';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const usuarioId = new URL(req.url).searchParams.get('usuarioId');
    if (!usuarioId) return json([]);
    return json(await prisma.inscripciones.findMany({
      where: { usuario_id: usuarioId },
      include: {
        clase: {
          include: {
            materia: { select: { id: true, nombre: true } },
            instructor: { select: { id: true, nombre_completo: true } },
          },
        },
      },
      orderBy: { fecha_inscripcion: 'desc' },
    }));
  } catch (e) { return handleError(e); }
}
