import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, handleError } from '@/lib/route';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const usuarios = await prisma.usuarios.findMany({
      where: {
        estado: 'Activo',
        fecha_nacimiento: { not: null },
      },
      select: {
        id: true,
        nombre_completo: true,
        fecha_nacimiento: true,
        roles: { include: { rol: { select: { nombre: true } } } },
      },
      orderBy: { nombre_completo: 'asc' },
    });
    return json(usuarios);
  } catch (e) { return handleError(e); }
}
