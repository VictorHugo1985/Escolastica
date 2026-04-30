import { NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { json, err, handleError, ApiError } from '@/lib/route';

const JWT_SECRET = () => new TextEncoder().encode(process.env.JWT_SECRET ?? 'secret');

export async function POST(req: NextRequest) {
  try {
    const { email, password, rememberMe } = await req.json();

    const user = await prisma.usuarios.findUnique({
      where: { email },
      include: { roles: { include: { rol: true } } },
    });

    const isValid = user?.password_hash ? await bcrypt.compare(password, user.password_hash) : false;

    if (!user || !isValid) {
      await auditLog({ usuario_id: null, accion: 'INSERT', tabla_afectada: 'auth_intentos', valor_nuevo: { email, resultado: 'FALLIDO' } });
      throw new ApiError('Credenciales inválidas', 401);
    }

    if (user.estado === 'Inactivo') throw new ApiError('Usuario inactivo', 403);

    const roles = user.roles.map((r) => r.rol.nombre);
    const hasWebAccess = roles.some((r) => r === 'Instructor' || r === 'Escolastico');
    if (!hasWebAccess) throw new ApiError('Tu cuenta no tiene acceso a la aplicación en esta versión', 403);

    const accessToken = await new SignJWT({ sub: user.id, email: user.email, roles })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(process.env.JWT_EXPIRATION ?? '3600s')
      .sign(JWT_SECRET());

    const ttlDays = rememberMe ? 30 : 7;
    const rawRefresh = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefresh).digest('hex');

    await prisma.refresh_tokens.create({
      data: {
        usuario_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
      },
    });

    cookies().set('refresh_token', rawRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ttlDays * 24 * 60 * 60,
      path: '/',
    });

    return json({
      accessToken,
      expiresIn: 3600,
      mustChangePassword: user.must_change_password,
      user: { id: user.id, email: user.email, roles },
    });
  } catch (e) {
    return handleError(e);
  }
}
