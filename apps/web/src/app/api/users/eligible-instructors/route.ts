import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, handleError } from '@/lib/route';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const users = await prisma.usuarios.findMany({
      where: { roles: { some: { rol: { nombre: 'Instructor' } } }, estado: 'Activo' },
      select: { id: true, nombre_completo: true, email: true },
      orderBy: { nombre_completo: 'asc' },
    });
    return json(users);
  } catch (e) { return handleError(e); }
}
