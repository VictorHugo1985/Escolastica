import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, handleError, ApiError } from '@/lib/route';

export async function DELETE(req: NextRequest, { params }: { params: { id: string; horarioId: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const horario = await prisma.horarios.findFirst({ where: { id: params.horarioId, clase_id: params.id } });
    if (!horario) throw new ApiError('Horario no encontrado', 404);
    await prisma.horarios.delete({ where: { id: params.horarioId } });
    return new NextResponse(null, { status: 204 });
  } catch (e) { return handleError(e); }
}
