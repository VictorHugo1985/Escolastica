import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

export class ApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message: string | string[], status: number) {
  return NextResponse.json({ message }, { status });
}

function getJwtSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? 'secret');
}

export async function getAuth(req: NextRequest): Promise<JwtPayload | null> {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(auth.slice(7), getJwtSecret());
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export async function requireAuth(req: NextRequest): Promise<JwtPayload> {
  const payload = await getAuth(req);
  if (!payload) throw new ApiError('No autorizado', 401);
  return payload;
}

export function requireRole(payload: JwtPayload, ...roles: string[]) {
  if (!roles.some((r) => payload.roles.includes(r))) {
    throw new ApiError('Sin permisos suficientes', 403);
  }
}

export function handleError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return err(error.message, error.status);
  }
  const msg = error instanceof Error ? error.message : 'Error interno';
  if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('no encontrad')) {
    return err(msg, 404);
  }
  if (msg.toLowerCase().includes('ya exist') || msg.toLowerCase().includes('duplicad') || msg.toLowerCase().includes('conflict')) {
    return err(msg, 409);
  }
  if (msg.toLowerCase().includes('inválid') || msg.toLowerCase().includes('requerid') || msg.toLowerCase().includes('no se puede')) {
    return err(msg, 400);
  }
  console.error('[API Error]', error);
  return err(msg || 'Error interno del servidor', 500);
}

export function signJwt(payload: { sub: string; email: string; roles: string[] }, expiresIn = '3600s') {
  const { SignJWT } = require('jose');
  const secret = getJwtSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresIn)
    .sign(secret);
}
