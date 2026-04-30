import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, json, handleError } from '@/lib/route';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    return json(await prisma.sesiones.findMany({
      where: { clase_id: params.id },
      orderBy: { fecha: 'desc' },
      include: {
        tema: { select: { id: true, titulo: true } },
        _count: { select: { asistencias: { where: { estado: 'Presente' } } } },
      },
    }));
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Instructor', 'Escolastico');
    const body = await req.json();
    const fecha = body?.fecha ? new Date(body.fecha) : new Date();
    return json(await prisma.sesiones.create({
      data: { clase_id: params.id, fecha, tipo: body?.tipo ?? 'Clase', tema_id: body?.tema_id ?? null, comentarios: body?.comentarios ?? null },
    }), 201);
  } catch (e) { return handleError(e); }
}
