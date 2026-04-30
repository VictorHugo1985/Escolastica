import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, json, handleError } from '@/lib/route';

export async function PATCH(req: NextRequest, { params }: { params: { id: string; sesionId: string; asistenciaId: string } }) {
  try {
    const actor = await requireAuth(req);
    const dto = await req.json();
    const existing = await prisma.asistencias.findUnique({ where: { id: params.asistenciaId } });
    const updated = await prisma.asistencias.update({ where: { id: params.asistenciaId }, data: { estado: dto.estado } });
    await auditLog({ usuario_id: actor.sub, accion: 'UPDATE', tabla_afectada: 'asistencias', valor_anterior: existing as Record<string, unknown>, valor_nuevo: updated as Record<string, unknown> });
    return json(updated);
  } catch (e) { return handleError(e); }
}
