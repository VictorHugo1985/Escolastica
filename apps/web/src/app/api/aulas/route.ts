import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    return json(await prisma.aulas.findMany({ orderBy: { nombre: 'asc' } }));
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const data = await req.json();

    const existing = await prisma.aulas.findFirst({ where: { nombre: { equals: data.nombre, mode: 'insensitive' } } });
    if (existing) throw new ApiError('Ya existe un aula con ese nombre', 409);

    const aula = await prisma.aulas.create({ data });
    await auditLog({ usuario_id: actor.sub, accion: 'INSERT', tabla_afectada: 'aulas', valor_nuevo: { id: aula.id, nombre: aula.nombre } });
    return json(aula, 201);
  } catch (e) { return handleError(e); }
}
