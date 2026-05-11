import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

export async function POST(req: NextRequest, { params }: { params: { categoria: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');

    const body = await req.json();
    const codigo: string = body?.codigo?.trim();
    const etiqueta: string = body?.etiqueta?.trim();
    const ordenBody: number | undefined = body?.orden;

    if (!codigo || codigo.length > 50) throw new ApiError('codigo requerido (1–50 chars)', 400);
    if (!etiqueta || etiqueta.length > 100) throw new ApiError('etiqueta requerida (1–100 chars)', 400);

    const categoria = await prisma.enum_categorias.findUnique({ where: { nombre: params.categoria } });
    if (!categoria) throw new ApiError('Categoría no encontrada', 404);

    const [dupCodigo, dupEtiqueta] = await Promise.all([
      prisma.enum_valores.findFirst({
        where: { categoria_id: categoria.id, codigo: { equals: codigo, mode: 'insensitive' } },
      }),
      prisma.enum_valores.findFirst({
        where: { categoria_id: categoria.id, etiqueta: { equals: etiqueta, mode: 'insensitive' } },
      }),
    ]);
    if (dupCodigo) throw new ApiError('El código ya existe en esta categoría', 409);
    if (dupEtiqueta) throw new ApiError('La etiqueta ya existe en esta categoría', 409);

    let orden = ordenBody;
    if (orden === undefined) {
      const maxOrden = await prisma.enum_valores.aggregate({
        where: { categoria_id: categoria.id },
        _max: { orden: true },
      });
      orden = (maxOrden._max.orden ?? 0) + 1;
    }

    const nuevo = await prisma.enum_valores.create({
      data: { categoria_id: categoria.id, codigo, etiqueta, activo: true, orden },
      select: { id: true, codigo: true, etiqueta: true, activo: true, orden: true },
    });

    await auditLog({
      usuario_id: actor.sub,
      accion: 'CREATE',
      tabla_afectada: 'enum_valores',
      valor_nuevo: { categoria: params.categoria, codigo, etiqueta },
    });

    return json(nuevo, 201);
  } catch (e) { return handleError(e); }
}
