import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, handleError, ApiError } from '@/lib/route';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const claseId = new URL(req.url).searchParams.get('claseId');
    if (!claseId) throw new ApiError('claseId es requerido', 400);

    const clase = await prisma.clases.findUnique({ where: { id: claseId }, include: { materia: { select: { es_curso_probacion: true } } } });
    if (!clase) throw new ApiError('Clase no encontrada', 404);

    if (clase.materia.es_curso_probacion) {
      return json(await prisma.usuarios.findMany({
        where: { estado: 'Activo', id: { not: clase.instructor_id }, roles: { some: { rol: { nombre: 'Probacionista' } } } },
        select: { id: true, nombre_completo: true, email: true }, orderBy: { nombre_completo: 'asc' },
      }));
    }

    return json(await prisma.usuarios.findMany({
      where: { estado: 'Activo', id: { not: clase.instructor_id }, NOT: { roles: { some: { rol: { nombre: { in: ['Probacionista', 'ExProbacionista'] } } } } } },
      select: { id: true, nombre_completo: true, email: true }, orderBy: { nombre_completo: 'asc' },
    }));
  } catch (e) { return handleError(e); }
}
