import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

const ROLES_INCLUDE = { roles: { include: { rol: true } } };
const ROLES_DESTINO_VALIDOS = ['Miembro', 'Probacionista'] as const;
type RolDestino = typeof ROLES_DESTINO_VALIDOS[number];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const { id } = params;
    const { rolDestino }: { rolDestino: RolDestino } = await req.json();

    if (!ROLES_DESTINO_VALIDOS.includes(rolDestino)) {
      throw new ApiError(`rolDestino debe ser uno de: ${ROLES_DESTINO_VALIDOS.join(', ')}`, 400);
    }

    const user = await prisma.usuarios.findUnique({ where: { id }, include: ROLES_INCLUDE });
    if (!user) throw new ApiError('Usuario no encontrado', 404);
    if (!user.roles.some((r) => r.rol.nombre === 'ExMiembro')) throw new ApiError('El usuario no tiene el rol ExMiembro', 400);

    const exMiembroRol = await prisma.roles.findUnique({ where: { nombre: 'ExMiembro' } });
    const destRol      = await prisma.roles.findUnique({ where: { nombre: rolDestino } });
    if (!exMiembroRol || !destRol) throw new ApiError('Roles no encontrados en el sistema', 400);

    await prisma.$transaction([
      prisma.usuario_roles.delete({ where: { usuario_id_rol_id: { usuario_id: id, rol_id: exMiembroRol.id } } }),
      prisma.usuario_roles.create({ data: { usuario_id: id, rol_id: destRol.id, asignado_por_id: actor.sub } }),
      prisma.usuarios.update({ where: { id }, data: { estado: 'Activo' } }),
    ]);

    await auditLog({
      usuario_id: actor.sub,
      accion: 'UPDATE',
      tabla_afectada: 'usuarios',
      valor_anterior: { id, rol: 'ExMiembro', estado: user.estado },
      valor_nuevo: { id, rol: rolDestino, estado: 'Activo' },
    });

    return json(await prisma.usuarios.findUnique({ where: { id }, include: ROLES_INCLUDE }));
  } catch (e) { return handleError(e); }
}
