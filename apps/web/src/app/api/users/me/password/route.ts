import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, handleError, ApiError } from '@/lib/route';

export async function PATCH(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    const { current_password, new_password } = await req.json();

    const user = await prisma.usuarios.findUnique({ where: { id: actor.sub } });
    if (!user) throw new ApiError('Usuario no encontrado', 404);

    const valid = user.password_hash ? await bcrypt.compare(current_password, user.password_hash) : false;
    if (!valid) throw new ApiError('La contraseña actual es incorrecta', 400);

    const hash = await bcrypt.hash(new_password, 12);
    await prisma.usuarios.update({ where: { id: actor.sub }, data: { password_hash: hash, must_change_password: false } });
    return json({}, 204);
  } catch (e) { return handleError(e); }
}
