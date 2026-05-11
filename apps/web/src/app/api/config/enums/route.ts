import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, handleError } from '@/lib/route';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const categorias = await prisma.enum_categorias.findMany({
      include: {
        valores: { select: { activo: true } },
      },
      orderBy: { etiqueta: 'asc' },
    });
    const result = categorias.map((c) => ({
      nombre: c.nombre,
      etiqueta: c.etiqueta,
      descripcion: c.descripcion,
      total_valores: c.valores.length,
      valores_activos: c.valores.filter((v) => v.activo).length,
    }));
    return json(result);
  } catch (e) { return handleError(e); }
}
