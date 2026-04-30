import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, handleError } from '@/lib/route';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    return json(await prisma.inscripciones.findMany({
      where: { clase_id: params.id },
      include: { usuario: { select: { id: true, nombre_completo: true, email: true } } },
      orderBy: [{ estado: 'asc' }, { fecha_inscripcion: 'asc' }],
    }));
  } catch (e) { return handleError(e); }
}
