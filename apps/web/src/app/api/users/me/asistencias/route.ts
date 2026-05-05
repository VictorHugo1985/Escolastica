import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, handleError } from '@/lib/route';

export async function GET(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    const claseId = new URL(req.url).searchParams.get('claseId') ?? undefined;

    const inscripciones = await prisma.inscripciones.findMany({
      where: { usuario_id: actor.sub, ...(claseId && { clase_id: claseId }) },
      include: {
        clase: { include: { materia: { select: { id: true, nombre: true } } } },
        asistencias: { select: { estado: true, sesion: { select: { fecha: true } } }, orderBy: { sesion: { fecha: 'desc' } } },
      },
    });

    return json(inscripciones.map((insc) => {
      const total = insc.asistencias.length;
      const presentes = insc.asistencias.filter((a) => a.estado === 'Presente').length;
      return {
        inscripcion_id: insc.id,
        clase: { id: insc.clase.id, codigo: insc.clase.codigo, estado: insc.clase.estado, materia: insc.clase.materia },
        nota_final: insc.nota_final,
        concluyo_temario: insc.concluyo_temario_materia,
        fecha_conclusion_temario: insc.fecha_conclusion_temario,
        total_sesiones: total, presentes,
        ausentes: insc.asistencias.filter((a) => a.estado === 'Ausente').length,
        licencias: insc.asistencias.filter((a) => a.estado === 'Licencia').length,
        porcentaje: total > 0 ? Math.round((presentes / total) * 100) : 0,
        ultimas_sesiones: insc.asistencias.slice(0, 10).reverse().map((a) => ({ fecha: a.sesion.fecha, estado: a.estado })),
      };
    }));
  } catch (e) { return handleError(e); }
}
