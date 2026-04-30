import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendPasswordReset, sendWelcomeCredentials } from '@/lib/email';
import { json, handleError } from '@/lib/route';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const user = await prisma.usuarios.findUnique({ where: { email }, include: { roles: { include: { rol: true } } } });
    if (!user || user.estado === 'Inactivo') return json({});

    const tieneAcceso = user.roles.some((r) => ['Instructor', 'Escolastico'].includes(r.rol.nombre));
    if (!tieneAcceso) return json({});

    if (user.password_hash) {
      await prisma.tokens_recuperacion.updateMany({ where: { usuario_id: user.id, used: false }, data: { used: true } });
      const token = crypto.randomBytes(32).toString('hex');
      await prisma.tokens_recuperacion.create({ data: { usuario_id: user.id, token, expires_at: new Date(Date.now() + 60 * 60 * 1000) } });
      await sendPasswordReset(email, token);
      return json({ tipo: 'recuperacion' });
    }

    const tempPassword = crypto.randomBytes(8).toString('base64url');
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    await prisma.usuarios.update({ where: { id: user.id }, data: { password_hash: passwordHash, must_change_password: true } });
    await sendWelcomeCredentials(email, tempPassword);
    return json({ tipo: 'nueva_activacion' });
  } catch (e) {
    return handleError(e);
  }
}
