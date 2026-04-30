import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    return json(await prisma.temas.findMany({ where: { materia_id: params.id, estado: 'Activo' }, orderBy: { orden: 'asc' } }));
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const data = await req.json();
    const materia = await prisma.materias.findUnique({ where: { id: params.id } });
    if (!materia) throw new ApiError('Materia no encontrada', 404);
    const count = await prisma.temas.count({ where: { materia_id: params.id, estado: 'Activo' } });
    const tema = await prisma.temas.create({ data: { titulo: data.titulo, descripcion: data.descripcion, orden: data.orden ?? (count + 1), materia_id: params.id, estado: 'Activo' } });
    await auditLog({ usuario_id: actor.sub, accion: 'INSERT', tabla_afectada: 'temas', valor_nuevo: { id: tema.id, titulo: tema.titulo, materia_id: params.id } });
    return json(tema, 201);
  } catch (e) { return handleError(e); }
}
