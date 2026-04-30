import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, json, handleError } from '@/lib/route';

export async function GET(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const { searchParams } = new URL(req.url);
    const tabla_afectada = searchParams.get('tabla_afectada') ?? undefined;
    const usuario_id = searchParams.get('usuario_id') ?? undefined;
    const accion = searchParams.get('accion') ?? undefined;
    const fechaDesde = searchParams.get('fechaDesde') ?? undefined;
    const fechaHasta = searchParams.get('fechaHasta') ?? undefined;
    const page = Number(searchParams.get('page') ?? '1');
    const limit = Number(searchParams.get('limit') ?? '50');
    const skip = (page - 1) * limit;

    const where: any = {
      ...(tabla_afectada && { tabla_afectada }),
      ...(usuario_id && { usuario_id }),
      ...(accion && { accion }),
      ...((fechaDesde || fechaHasta) && {
        created_at: {
          ...(fechaDesde && { gte: new Date(fechaDesde) }),
          ...(fechaHasta && { lte: new Date(fechaHasta + 'T23:59:59Z') }),
        },
      }),
    };

    const [data, total] = await Promise.all([
      prisma.logs_auditoria.findMany({
        where,
        include: { usuario: { select: { id: true, nombre_completo: true } } },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.logs_auditoria.count({ where }),
    ]);

    return json({ data, total, page, limit });
  } catch (e) { return handleError(e); }
}
