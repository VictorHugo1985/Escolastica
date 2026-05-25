import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, handleError } from '@/lib/route';

export async function POST(req: NextRequest, { params }: { params: { id: string; sesionId: string } }) {
  try {
    const actor = await requireAuth(req);
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

    // Fire-and-forget: registrar notificación de pase de lista
    (async () => {
      try {
        const totalPresentes = dto.asistencias.filter((a: { estado: string }) => a.estado === 'Presente').length;
        const [actorUser, clase] = await Promise.all([
          prisma.usuarios.findUnique({ where: { id: actor.sub }, select: { nombre_completo: true } }),
          prisma.clases.findUnique({ where: { id: params.id }, include: { materia: { select: { nombre: true } } } }),
        ]);
        if (actorUser && clase) {
          const descripcion = `${actorUser.nombre_completo} pasó lista en ${clase.materia.nombre}: ${totalPresentes} asistentes`;
          await prisma.notificaciones_actividad.create({
            data: { tipo: 'pase_de_lista', descripcion, actor_id: actor.sub, clase_id: params.id },
          });
        }
      } catch {
        // Silently ignore — no afecta la respuesta al cliente
      }
    })();

    return json({ ok: true });
  } catch (e) { return handleError(e); }
}
