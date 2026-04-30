import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

const ROLES_INCLUDE = { roles: { include: { rol: true } } };

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const { id } = params;

    const user = await prisma.usuarios.findUnique({ where: { id }, include: ROLES_INCLUDE });
    if (!user) throw new ApiError('Usuario no encontrado', 404);
    if (!user.roles.some((r) => r.rol.nombre === 'Probacionista')) throw new ApiError('Solo se pueden promover Probacionistas', 400);

    const probRol = await prisma.roles.findUnique({ where: { nombre: 'Probacionista' } });
    const miembroRol = await prisma.roles.findUnique({ where: { nombre: 'Miembro' } });
    if (!probRol || !miembroRol) throw new ApiError('Roles no encontrados', 400);

    await prisma.$transaction([
      prisma.usuario_roles.delete({ where: { usuario_id_rol_id: { usuario_id: id, rol_id: probRol.id } } }),
      prisma.usuario_roles.create({ data: { usuario_id: id, rol_id: miembroRol.id, asignado_por_id: actor.sub } }),
    ]);
    await auditLog({ usuario_id: actor.sub, accion: 'UPDATE', tabla_afectada: 'usuarios', valor_anterior: { id, rol: 'Probacionista' }, valor_nuevo: { id, rol: 'Miembro' } });
    return json(await prisma.usuarios.findUnique({ where: { id }, include: ROLES_INCLUDE }));
  } catch (e) { return handleError(e); }
}
