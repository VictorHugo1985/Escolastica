import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const nombre = searchParams.get('nombre') ?? undefined;
    const estado = searchParams.get('estado') ?? undefined;
    const nivel = searchParams.get('nivel') ? Number(searchParams.get('nivel')) : undefined;
    const esCursoProbacion = searchParams.get('es_curso_probacion') === 'true' ? true : searchParams.get('es_curso_probacion') === 'false' ? false : undefined;

    return json(await prisma.materias.findMany({
      where: {
        ...(nombre && { nombre: { contains: nombre, mode: 'insensitive' } }),
        ...(estado && { estado: estado as any }),
        ...(esCursoProbacion !== undefined && { es_curso_probacion: esCursoProbacion }),
        ...(nivel !== undefined && { nivel }),
      },
      include: { _count: { select: { temas: true, clases: true } } },
      orderBy: [{ nivel: 'asc' }, { nombre: 'asc' }],
    }));
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const data = await req.json();

    const existing = await prisma.materias.findFirst({ where: { nombre: { equals: data.nombre, mode: 'insensitive' } } });
    if (existing) throw new ApiError(`Ya existe una materia con el nombre '${data.nombre}'`, 409);

    const materia = await prisma.materias.create({ data });
    await auditLog({ usuario_id: actor.sub, accion: 'INSERT', tabla_afectada: 'materias', valor_nuevo: { id: materia.id, nombre: materia.nombre } });
    return json(materia, 201);
  } catch (e) { return handleError(e); }
}
