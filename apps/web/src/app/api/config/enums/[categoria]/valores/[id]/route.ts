import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { categoria: string; id: string } },
) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');

    const body = await req.json();
    const { etiqueta, activo, orden } = body ?? {};

    if (etiqueta === undefined && activo === undefined && orden === undefined) {
      throw new ApiError('Se requiere al menos un campo: etiqueta, activo u orden', 400);
    }

    const categoria = await prisma.enum_categorias.findUnique({ where: { nombre: params.categoria } });
    if (!categoria) throw new ApiError('Categoría no encontrada', 404);

    const valor = await prisma.enum_valores.findFirst({
      where: { id: params.id, categoria_id: categoria.id },
    });
    if (!valor) throw new ApiError('Valor no encontrado en la categoría indicada', 404);

    if (etiqueta !== undefined) {
      const trimmed: string = String(etiqueta).trim();
      if (!trimmed || trimmed.length > 100) throw new ApiError('etiqueta inválida (1–100 chars)', 400);
      const dup = await prisma.enum_valores.findFirst({
        where: {
          categoria_id: categoria.id,
          etiqueta: { equals: trimmed, mode: 'insensitive' },
          NOT: { id: params.id },
        },
      });
      if (dup) throw new ApiError('La etiqueta ya existe en esta categoría', 409);
    }

    const valorAnterior = { etiqueta: valor.etiqueta, activo: valor.activo, orden: valor.orden };

    const data: Record<string, unknown> = {};
    if (etiqueta !== undefined) data.etiqueta = String(etiqueta).trim();
    if (activo !== undefined) data.activo = Boolean(activo);
    if (orden !== undefined) data.orden = Number(orden);

    const actualizado = await prisma.enum_valores.update({
      where: { id: params.id },
      data,
      select: { id: true, codigo: true, etiqueta: true, activo: true, orden: true },
    });

    await auditLog({
      usuario_id: actor.sub,
      accion: 'UPDATE',
      tabla_afectada: 'enum_valores',
      valor_anterior: { ...valorAnterior, categoria: params.categoria, codigo: valor.codigo },
      valor_nuevo: { ...data, categoria: params.categoria, codigo: valor.codigo },
    });

    return json(actualizado);
  } catch (e) { return handleError(e); }
}
