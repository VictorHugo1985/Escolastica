import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendPasswordReset } from '@/lib/email';
import { json, handleError } from '@/lib/route';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const user = await prisma.usuarios.findUnique({ where: { email } });
    if (!user || user.estado === 'Inactivo') return json({ enviado: false });

    await prisma.tokens_recuperacion.updateMany({ where: { usuario_id: user.id, used: false }, data: { used: true } });

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.tokens_recuperacion.create({
      data: { usuario_id: user.id, token, expires_at: new Date(Date.now() + 60 * 60 * 1000) },
    });

    await sendPasswordReset(email, token);
    return json({ enviado: true });
  } catch (e) {
    return handleError(e);
  }
}
