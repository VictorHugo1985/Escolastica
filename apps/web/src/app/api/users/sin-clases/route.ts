import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, json, handleError } from '@/lib/route';

export async function GET(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');

    const usuarios = await prisma.usuarios.findMany({
      where: {
        AND: [
          { estado: 'Activo' },
          { NOT: { roles: { some: { rol: { nombre: { in: ['ExMiembro', 'ExProbacionista', 'Probacionista'] } } } } } },
          { NOT: { inscripciones: { some: { estado: 'Activo', clase: { estado: 'Activa' } } } } },
        ],
      },
      include: { roles: { include: { rol: true } } },
      orderBy: { nombre_completo: 'asc' },
    });

    return json(usuarios);
  } catch (e) { return handleError(e); }
}
