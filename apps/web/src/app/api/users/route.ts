import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

const ROLES_INCLUDE = { roles: { include: { rol: true } } };

export async function GET(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const rol = searchParams.get('rol') ?? undefined;
    const estado = searchParams.get('estado') ?? undefined;
    const search = searchParams.get('search') ?? undefined;

    const users = await prisma.usuarios.findMany({
      where: {
        ...(rol && { roles: { some: { rol: { nombre: rol } } } }),
        ...(estado && { estado: estado as any }),
        ...(search && { OR: [
          { nombre_completo: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ] }),
      },
      include: ROLES_INCLUDE,
      orderBy: { nombre_completo: 'asc' },
    });
    return json(users);
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const data = await req.json();
    const rolNombre = data.rolNombre ?? 'Probacionista';

    const rol = await prisma.roles.findUnique({ where: { nombre: rolNombre } });
    if (!rol) throw new ApiError(`Rol '${rolNombre}' no existe`, 400);

    if (data.email) {
      const existing = await prisma.usuarios.findUnique({ where: { email: data.email } });
      if (existing) throw new ApiError('El email ya está registrado', 409);
    }
    if (data.ci) {
      const existingCi = await prisma.usuarios.findFirst({ where: { ci: data.ci } });
      if (existingCi) throw new ApiError('El CI ya está registrado', 409);
    }

    const userId = crypto.randomUUID();
    await prisma.usuarios.create({
      data: {
        id: userId,
        email: data.email || undefined,
        nombre_completo: data.nombre_completo,
        genero: data.genero || undefined,
        fecha_nacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : undefined,
        telefono: data.telefono || undefined,
        ci: data.ci || undefined,
        foto_url: data.foto_url || undefined,
        fecha_inscripcion: data.fecha_inscripcion ? new Date(data.fecha_inscripcion) : undefined,
        fecha_recibimiento: data.fecha_recibimiento ? new Date(data.fecha_recibimiento) : undefined,
      },
    });
    await prisma.usuario_roles.create({ data: { usuario_id: userId, rol_id: rol.id, asignado_por_id: actor.sub } });
    await auditLog({ usuario_id: actor.sub, accion: 'INSERT', tabla_afectada: 'usuarios', valor_nuevo: { id: userId, email: data.email, rol: rolNombre } });

    const user = await prisma.usuarios.findUnique({ where: { id: userId }, include: ROLES_INCLUDE });
    return json(user, 201);
  } catch (e) { return handleError(e); }
}
