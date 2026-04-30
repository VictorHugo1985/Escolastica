import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

const EXCLUSIVE = ['Probacionista', 'ExProbacionista', 'ExMiembro'];
const ROLES_INCLUDE = { roles: { include: { rol: true } } };

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const { rol: rolNombre } = await req.json();
    const { id } = params;

    const user = await prisma.usuarios.findUnique({ where: { id }, include: ROLES_INCLUDE });
    if (!user) throw new ApiError('Usuario no encontrado', 404);
    const currentRoles = user.roles.map((r) => r.rol.nombre);

    if (currentRoles.includes(rolNombre)) throw new ApiError(`El usuario ya tiene el rol '${rolNombre}'`, 409);

    if (rolNombre === 'ExMiembro') {
      const exMiembroRol = await prisma.roles.findUnique({ where: { nombre: 'ExMiembro' } });
      if (!exMiembroRol) throw new ApiError("Rol 'ExMiembro' no existe", 400);
      await prisma.$transaction([
        prisma.usuario_roles.deleteMany({ where: { usuario_id: id } }),
        prisma.usuario_roles.create({ data: { usuario_id: id, rol_id: exMiembroRol.id, asignado_por_id: actor.sub } }),
        prisma.usuarios.update({ where: { id }, data: { estado: 'Inactivo' } }),
      ]);
      await auditLog({ usuario_id: actor.sub, accion: 'UPDATE', tabla_afectada: 'usuarios', valor_anterior: { id, roles: currentRoles }, valor_nuevo: { id, rol: 'ExMiembro', estado: 'Inactivo' } });
      return json(await prisma.usuarios.findUnique({ where: { id }, include: ROLES_INCLUDE }));
    }

    if (currentRoles.some((r) => EXCLUSIVE.includes(r))) throw new ApiError(`Los roles ${EXCLUSIVE.join(', ')} no pueden combinarse`, 400);
    if (EXCLUSIVE.includes(rolNombre) && currentRoles.length > 0) throw new ApiError(`El rol '${rolNombre}' no puede combinarse con otros roles`, 400);

    const rol = await prisma.roles.findUnique({ where: { nombre: rolNombre } });
    if (!rol) throw new ApiError(`Rol '${rolNombre}' no existe`, 400);
    await prisma.usuario_roles.create({ data: { usuario_id: id, rol_id: rol.id, asignado_por_id: actor.sub } });
    await auditLog({ usuario_id: actor.sub, accion: 'INSERT', tabla_afectada: 'usuario_roles', valor_nuevo: { usuario_id: id, rol: rolNombre } });

    return json(await prisma.usuarios.findUnique({ where: { id }, include: ROLES_INCLUDE }));
  } catch (e) { return handleError(e); }
}
