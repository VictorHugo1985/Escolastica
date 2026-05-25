import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, json, handleError } from '@/lib/route';

function toDto(n: {
  id: string;
  tipo: string;
  descripcion: string;
  actor: { id: string; nombre_completo: string } | null;
  clase: ({ id: string; codigo: string; materia: { nombre: string } } & Record<string, unknown>) | null;
  usuario_afectado: { id: string; nombre_completo: string } | null;
  created_at: Date;
}) {
  return {
    id: n.id,
    tipo: n.tipo,
    descripcion: n.descripcion,
    actor: n.actor,
    clase: n.clase ? { id: n.clase.id, codigo: n.clase.codigo, materia: n.clase.materia.nombre } : null,
    usuario_afectado: n.usuario_afectado,
    created_at: n.created_at.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico', 'Instructor');

    const [notificaciones, ultimaVista] = await Promise.all([
      prisma.notificaciones_actividad.findMany({
        orderBy: { created_at: 'desc' },
        take: 20,
        include: {
          actor: { select: { id: true, nombre_completo: true } },
          clase: { include: { materia: { select: { nombre: true } } } },
          usuario_afectado: { select: { id: true, nombre_completo: true } },
        },
      }),
      prisma.notificaciones_ultima_vista.findUnique({
        where: { usuario_id: actor.sub },
      }),
    ]);

    const total_no_leidas = ultimaVista
      ? await prisma.notificaciones_actividad.count({
          where: { created_at: { gt: ultimaVista.ultima_vista } },
        })
      : await prisma.notificaciones_actividad.count();

    return json({ notificaciones: notificaciones.map(toDto), total_no_leidas });
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico', 'Instructor');

    await prisma.notificaciones_ultima_vista.upsert({
      where: { usuario_id: actor.sub },
      create: { usuario_id: actor.sub, ultima_vista: new Date() },
      update: { ultima_vista: new Date() },
    });

    return new Response(null, { status: 204 });
  } catch (e) {
    return handleError(e);
  }
}
