import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, handleError } from '@/lib/route';

export async function POST(req: NextRequest, { params }: { params: { id: string; sesionId: string } }) {
  try {
    await requireAuth(req);
    const dto = await req.json();

    const sesion = await prisma.sesiones.findUnique({ where: { id: params.sesionId }, select: { clase_id: true } });
    const inscripciones = await prisma.inscripciones.findMany({
      where: { clase_id: sesion!.clase_id, estado: 'Activo' },
      select: { id: true },
    });

    const payloadMap = new Map<string, string>(dto.asistencias.map((a: { inscripcion_id: string; estado: string }) => [a.inscripcion_id, a.estado]));

    await prisma.$transaction(
      inscripciones.map((insc) =>
        prisma.asistencias.upsert({
          where: { inscripcion_id_sesion_id: { inscripcion_id: insc.id, sesion_id: params.sesionId } },
          create: { inscripcion_id: insc.id, sesion_id: params.sesionId, estado: (payloadMap.get(insc.id) ?? 'Ausente') as any },
          update: { estado: (payloadMap.get(insc.id) ?? 'Ausente') as any },
        }),
      ),
    );

    return json({ ok: true });
  } catch (e) { return handleError(e); }
}
