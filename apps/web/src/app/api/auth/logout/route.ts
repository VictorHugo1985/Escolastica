import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, handleError } from '@/lib/route';

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    await prisma.refresh_tokens.updateMany({
      where: { usuario_id: actor.sub, revoked: false },
      data: { revoked: true },
    });
    cookies().delete('refresh_token');
    return json({}, 204);
  } catch (e) {
    return handleError(e);
  }
}
