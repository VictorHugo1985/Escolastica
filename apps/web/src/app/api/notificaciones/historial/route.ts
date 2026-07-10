import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, json, handleError } from '@/lib/route';

export async function GET(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico', 'Instructor');

    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo') ?? undefined;
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
    const skip = (page - 1) * limit;

    const validTipos = ['pase_de_lista', 'baja_inscrito', 'promocion_miembro', 'clase_inactiva'];
    const where = tipo && validTipos.includes(tipo) ? { tipo } : {};

    const [notificaciones, total] = await Promise.all([
      prisma.notificaciones_actividad.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          actor: { select: { id: true, nombre_completo: true } },
          clase: { include: { materia: { select: { nombre: true } } } },
          usuario_afectado: { select: { id: true, nombre_completo: true } },
        },
      }),
      prisma.notificaciones_actividad.count({ where }),
    ]);

    return json({
      notificaciones: notificaciones.map((n) => ({
        id: n.id,
        tipo: n.tipo,
        descripcion: n.descripcion,
        actor: n.actor,
        clase: n.clase ? { id: n.clase.id, codigo: n.clase.codigo, materia: n.clase.materia.nombre } : null,
        usuario_afectado: n.usuario_afectado,
        created_at: n.created_at.toISOString(),
      })),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    });
  } catch (e) {
    return handleError(e);
  }
}
