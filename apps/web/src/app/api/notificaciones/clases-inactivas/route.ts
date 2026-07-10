import { NextRequest } from 'next/server';
import { requireAuth, requireRole, json, handleError } from '@/lib/route';
import { evaluarClasesInactivas } from '@/lib/clases-inactivas';

export async function GET(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico', 'Instructor');

    const clases = await evaluarClasesInactivas();
    return json({ clases });
  } catch (e) {
    return handleError(e);
  }
}
