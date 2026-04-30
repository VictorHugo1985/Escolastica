import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, json, handleError } from '@/lib/route';

export async function GET(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');

    const users = await prisma.usuarios.findMany({
      where: { roles: { some: { rol: { nombre: 'Probacionista' } } } },
      include: {
        roles: { include: { rol: true } },
        inscripciones: {
          where: { clase: { materia: { es_curso_probacion: true } } },
          orderBy: { fecha_inscripcion: 'desc' },
          take: 1,
          include: { clase: { include: { materia: { select: { nombre: true } }, instructor: { select: { id: true, nombre_completo: true } } } } },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    return json(users.map((u) => {
      const insc = u.inscripciones[0] ?? null;
      const { inscripciones, ...rest } = u;
      return { ...rest, instructor_referencia: insc ? { nombre_completo: insc.clase.instructor.nombre_completo, estado_inscripcion: insc.estado, materia: insc.clase.materia.nombre } : null };
    }));
  } catch (e) { return handleError(e); }
}
