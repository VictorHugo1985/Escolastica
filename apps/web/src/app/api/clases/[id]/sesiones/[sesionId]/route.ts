import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

export async function GET(req: NextRequest, { params }: { params: { id: string; sesionId: string } }) {
  try {
    await requireAuth(req);
    const sesion = await prisma.sesiones.findUnique({ where: { id: params.sesionId }, include: { tema: { select: { id: true, titulo: true } } } });
    if (!sesion) throw new ApiError('Sesión no encontrada', 404);
    return json(sesion);
  } catch (e) { return handleError(e); }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string; sesionId: string } }) {
  try {
    await requireAuth(req);
    const dto = await req.json();
    return json(await prisma.sesiones.update({
      where: { id: params.sesionId },
      data: {
        ...(dto.tipo !== undefined && { tipo: dto.tipo }),
        ...(dto.tema_id !== undefined && { tema_id: dto.tema_id }),
        ...(dto.comentarios !== undefined && { comentarios: dto.comentarios }),
        ...(dto.fecha !== undefined && { fecha: new Date(dto.fecha) }),
      },
    }));
  } catch (e) { return handleError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; sesionId: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const sesion = await prisma.sesiones.findUnique({ where: { id: params.sesionId } });
    if (!sesion) throw new ApiError('Sesión no encontrada', 404);
    await prisma.asistencias.deleteMany({ where: { sesion_id: params.sesionId } });
    await prisma.sesiones.delete({ where: { id: params.sesionId } });
    return new NextResponse(null, { status: 204 });
  } catch (e) { return handleError(e); }
}
