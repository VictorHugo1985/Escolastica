import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

const ROLES_INCLUDE = { roles: { include: { rol: true } } };

export async function DELETE(req: NextRequest, { params }: { params: { id: string; rolNombre: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const { id, rolNombre } = params;

    const user = await prisma.usuarios.findUnique({ where: { id }, include: ROLES_INCLUDE });
    if (!user) throw new ApiError('Usuario no encontrado', 404);
    const currentRoles = user.roles.map((r) => r.rol.nombre);

    if (!currentRoles.includes(rolNombre)) throw new ApiError(`El usuario no tiene el rol '${rolNombre}'`, 400);
    if (currentRoles.length === 1) throw new ApiError('No se puede quitar el único rol del usuario', 400);

    if (rolNombre === 'Instructor') {
      const active = await prisma.clases.count({ where: { instructor_id: id, estado: 'Activa' } });
      if (active > 0) throw new ApiError('No se puede quitar el rol de Instructor: tiene clases activas', 409);
    }

    const rol = await prisma.roles.findUnique({ where: { nombre: rolNombre } });
    if (!rol) throw new ApiError(`Rol '${rolNombre}' no existe`, 400);
    await prisma.usuario_roles.delete({ where: { usuario_id_rol_id: { usuario_id: id, rol_id: rol.id } } });
    await auditLog({ usuario_id: actor.sub, accion: 'DELETE', tabla_afectada: 'usuario_roles', valor_anterior: { usuario_id: id, rol: rolNombre } });

    return json(await prisma.usuarios.findUnique({ where: { id }, include: ROLES_INCLUDE }));
  } catch (e) { return handleError(e); }
}
