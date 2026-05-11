import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    return json(await prisma.sesiones.findMany({
      where: { clase_id: params.id },
      orderBy: { fecha: 'desc' },
      include: {
        temas: { include: { tema: { select: { id: true, titulo: true } } } },
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
    const tipo: string = body?.tipo ?? 'Clase';
    const tipoValido = await prisma.enum_valores.findFirst({
      where: { categoria: { nombre: 'TipoSesion' }, codigo: tipo, activo: true },
    });
    if (!tipoValido) throw new ApiError('Tipo de sesión no válido', 400);
    const fecha = body?.fecha ? new Date(body.fecha) : new Date();
    const temaIds: string[] = Array.isArray(body?.tema_ids) ? body.tema_ids : (body?.tema_id ? [body.tema_id] : []);
    const sesion = await prisma.sesiones.create({
      data: {
        clase_id: params.id, fecha, tipo,
        comentarios: body?.comentarios ?? null,
        temas: temaIds.length > 0 ? { create: temaIds.map((id) => ({ tema_id: id })) } : undefined,
      },
      include: { temas: { include: { tema: { select: { id: true, titulo: true } } } } },
    });
    return json(sesion, 201);
  } catch (e) { return handleError(e); }
}
