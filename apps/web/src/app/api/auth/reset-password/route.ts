import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { json, handleError, ApiError } from '@/lib/route';

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();
    const record = await prisma.tokens_recuperacion.findUnique({ where: { token } });
    if (!record || record.used || record.expires_at < new Date()) throw new ApiError('Token inválido o expirado', 400);

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.$transaction([
      prisma.usuarios.update({ where: { id: record.usuario_id }, data: { password_hash: passwordHash, must_change_password: false } }),
      prisma.tokens_recuperacion.update({ where: { id: record.id }, data: { used: true } }),
    ]);
    return json({});
  } catch (e) {
    return handleError(e);
  }
}
