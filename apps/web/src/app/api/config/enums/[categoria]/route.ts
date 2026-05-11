import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, handleError, ApiError } from '@/lib/route';

export async function GET(req: NextRequest, { params }: { params: { categoria: string } }) {
  try {
    await requireAuth(req);
    const soloActivos = req.nextUrl.searchParams.get('activos') === 'true';
    const categoria = await prisma.enum_categorias.findUnique({
      where: { nombre: params.categoria },
      include: {
        valores: {
          where: soloActivos ? { activo: true } : {},
          orderBy: { orden: 'asc' },
          select: { id: true, codigo: true, etiqueta: true, activo: true, orden: true },
        },
      },
    });
    if (!categoria) throw new ApiError('Categoría no encontrada', 404);
    return json({
      nombre: categoria.nombre,
      etiqueta: categoria.etiqueta,
      descripcion: categoria.descripcion,
      valores: categoria.valores,
    });
  } catch (e) { return handleError(e); }
}
