import { NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { json, handleError, ApiError } from '@/lib/route';

const JWT_SECRET = () => new TextEncoder().encode(process.env.JWT_SECRET ?? 'secret');

export async function POST(req: NextRequest) {
  try {
    const rawToken = cookies().get('refresh_token')?.value;
    if (!rawToken) throw new ApiError('Refresh token no encontrado', 401);

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = await prisma.refresh_tokens.findUnique({
      where: { token_hash: tokenHash },
      include: { usuario: { include: { roles: { include: { rol: true } } } } },
    });

    if (!record || record.revoked || record.expires_at < new Date()) {
      throw new ApiError('Refresh token inválido o expirado', 401);
    }

    await prisma.refresh_tokens.update({ where: { id: record.id }, data: { revoked: true } });

    const roles = record.usuario.roles.map((r) => r.rol.nombre);
    const accessToken = await new SignJWT({ sub: record.usuario.id, email: record.usuario.email, roles })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(process.env.JWT_EXPIRATION ?? '3600s')
      .sign(JWT_SECRET());

    const newRaw = crypto.randomBytes(40).toString('hex');
    const newHash = crypto.createHash('sha256').update(newRaw).digest('hex');

    await prisma.refresh_tokens.create({
      data: {
        usuario_id: record.usuario.id,
        token_hash: newHash,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    cookies().set('refresh_token', newRaw, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return json({ accessToken, expiresIn: 3600 });
  } catch (e) {
    return handleError(e);
  }
}
