import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, handleError } from '@/lib/route';

export async function GET(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    const fecha = new URL(req.url).searchParams.get('fecha');
    const target = fecha ? new Date(fecha + 'T12:00:00') : new Date();
    const diaSemana = target.getDay();
    const esEscol = actor.roles.includes('Escolastico');

    if (esEscol) {
      return json(await prisma.clases.findMany({
        where: { estado: 'Activa' },
        include: {
          materia: { select: { id: true, nombre: true } },
          instructor: { select: { id: true, nombre_completo: true } },
          horarios: true,
          _count: { select: { inscripciones: { where: { estado: 'Activo' } } } },
        },
        orderBy: [{ materia: { nombre: 'asc' } }],
      }));
    }

    return json(await prisma.clases.findMany({
      where: { instructor_id: actor.sub, estado: 'Activa', horarios: { some: { dia_semana: diaSemana } } },
      include: {
        materia: { select: { id: true, nombre: true } },
        instructor: { select: { id: true, nombre_completo: true } },
        horarios: { where: { dia_semana: diaSemana } },
        _count: { select: { inscripciones: { where: { estado: 'Activo' } } } },
      },
    }));
  } catch (e) { return handleError(e); }
}
