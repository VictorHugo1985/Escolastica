import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, json, handleError } from '@/lib/route';

export async function GET(req: NextRequest, { params }: { params: { entidad: string; entidadId: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    return json(await prisma.logs_auditoria.findMany({
      where: {
        tabla_afectada: params.entidad,
        OR: [
          { valor_nuevo: { path: ['id'], equals: params.entidadId } },
          { valor_anterior: { path: ['id'], equals: params.entidadId } },
        ],
      },
      include: { usuario: { select: { id: true, nombre_completo: true } } },
      orderBy: { created_at: 'desc' },
    }));
  } catch (e) { return handleError(e); }
}
