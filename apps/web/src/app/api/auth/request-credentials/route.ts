import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendTokenCode } from '@/lib/email';
import { json, handleError } from '@/lib/route';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const user = await prisma.usuarios.findUnique({ where: { email }, include: { roles: { include: { rol: true } } } });
    if (!user || user.estado === 'Inactivo') return json({ tipo: null });

    const tieneAcceso = user.roles.some((r) => ['Instructor', 'Escolastico'].includes(r.rol.nombre));
    if (!tieneAcceso) return json({ tipo: null });

    const tipo = user.password_hash ? 'recuperacion' : 'nueva_activacion';

    // Invalida tokens anteriores
    await prisma.tokens_recuperacion.updateMany({ where: { usuario_id: user.id, used: false }, data: { used: true } });

    // Código alfanumérico de 6 caracteres (sin caracteres ambiguos)
    const bytes = crypto.randomBytes(6);
    const code = Array.from(bytes).map((b) => CHARS[b % CHARS.length]).join('');

    await prisma.tokens_recuperacion.create({
      data: { usuario_id: user.id, token: code, expires_at: new Date(Date.now() + 60 * 60 * 1000) },
    });

    await sendTokenCode(email, code);
    return json({ tipo });
  } catch (e) {
    return handleError(e);
  }
}
