import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    const aula = await prisma.aulas.findUnique({ where: { id: params.id }, include: { _count: { select: { horarios: true } } } });
    if (!aula) throw new ApiError('Aula no encontrada', 404);
    return json(aula);
  } catch (e) { return handleError(e); }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const data = await req.json();

    const before = await prisma.aulas.findUnique({ where: { id: params.id } });
    if (!before) throw new ApiError('Aula no encontrada', 404);

    if (data.nombre && data.nombre !== before.nombre) {
      const dup = await prisma.aulas.findFirst({ where: { nombre: { equals: data.nombre, mode: 'insensitive' }, NOT: { id: params.id } } });
      if (dup) throw new ApiError('Ya existe un aula con ese nombre', 409);
    }

    const updated = await prisma.aulas.update({ where: { id: params.id }, data });
    await auditLog({ usuario_id: actor.sub, accion: 'UPDATE', tabla_afectada: 'aulas', valor_anterior: { id: params.id, nombre: before.nombre, capacidad: before.capacidad }, valor_nuevo: { id: params.id, nombre: updated.nombre, capacidad: updated.capacidad } });
    return json(updated);
  } catch (e) { return handleError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');

    const aula = await prisma.aulas.findUnique({ where: { id: params.id } });
    if (!aula) throw new ApiError('Aula no encontrada', 404);

    const horarioCount = await prisma.horarios.count({ where: { aula_id: params.id } });
    if (horarioCount > 0) throw new ApiError(`No se puede eliminar: el aula tiene ${horarioCount} horario(s) vinculado(s)`, 409);

    await prisma.aulas.delete({ where: { id: params.id } });
    await auditLog({ usuario_id: actor.sub, accion: 'DELETE', tabla_afectada: 'aulas', valor_anterior: { id: params.id, nombre: aula.nombre } });
    return new NextResponse(null, { status: 204 });
  } catch (e) { return handleError(e); }
}
