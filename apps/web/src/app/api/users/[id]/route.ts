import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

const ROLES_INCLUDE = { roles: { include: { rol: true } } };

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    const user = await prisma.usuarios.findUnique({ where: { id: params.id }, include: ROLES_INCLUDE });
    if (!user) throw new ApiError('Usuario no encontrado', 404);
    return json(user);
  } catch (e) { return handleError(e); }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const data = await req.json();
    const before = await prisma.usuarios.findUnique({ where: { id: params.id } });
    if (!before) throw new ApiError('Usuario no encontrado', 404);

    if (data.ci && data.ci !== before.ci) {
      const dup = await prisma.usuarios.findFirst({ where: { ci: data.ci, NOT: { id: params.id } } });
      if (dup) throw new ApiError('El CI ya está registrado por otro usuario', 409);
    }
    if (data.email && data.email !== before.email) {
      const dup = await prisma.usuarios.findUnique({ where: { email: data.email } });
      if (dup) throw new ApiError('El email ya está registrado por otro usuario', 409);
    }

    const updated = await prisma.usuarios.update({
      where: { id: params.id },
      data: {
        ...('email' in data && { email: data.email || null }),
        ...(data.nombre_completo && { nombre_completo: data.nombre_completo }),
        ...(data.genero !== undefined && { genero: data.genero || null }),
        ...(data.fecha_nacimiento && { fecha_nacimiento: new Date(data.fecha_nacimiento) }),
        ...(data.telefono !== undefined && { telefono: data.telefono || null }),
        ...(data.ci !== undefined && { ci: data.ci || null }),
        ...(data.foto_url !== undefined && { foto_url: data.foto_url || null }),
        ...(data.fecha_inscripcion !== undefined && { fecha_inscripcion: data.fecha_inscripcion ? new Date(data.fecha_inscripcion) : null }),
        ...(data.fecha_recibimiento && { fecha_recibimiento: new Date(data.fecha_recibimiento) }),
        ...(data.estado !== undefined && { estado: data.estado as any }),
      },
      include: ROLES_INCLUDE,
    });

    await auditLog({ usuario_id: actor.sub, accion: 'UPDATE', tabla_afectada: 'usuarios', valor_anterior: { id: before.id, nombre_completo: before.nombre_completo }, valor_nuevo: { id: updated.id, nombre_completo: updated.nombre_completo } });
    return json(updated);
  } catch (e) { return handleError(e); }
}
