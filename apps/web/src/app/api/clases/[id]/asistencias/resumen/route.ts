import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, handleError } from '@/lib/route';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    const totalSesiones = await prisma.sesiones.count({ where: { clase_id: params.id } });
    const inscripciones = await prisma.inscripciones.findMany({
      where: { clase_id: params.id, estado: 'Activo' },
      include: {
        usuario: { select: { id: true, nombre_completo: true } },
        asistencias: {
          select: { estado: true, sesion: { select: { fecha: true, tipo: true, tema: { select: { titulo: true } } } } },
          orderBy: { sesion: { fecha: 'desc' } },
        },
      },
    });

    return json(inscripciones.map((insc) => {
      const presentes = insc.asistencias.filter((a) => a.estado === 'Presente').length;
      const ausentes = insc.asistencias.filter((a) => a.estado === 'Ausente').length;
      const licencias = insc.asistencias.filter((a) => a.estado === 'Licencia').length;
      return {
        inscripcion_id: insc.id,
        usuario: insc.usuario,
        total_sesiones: totalSesiones,
        presentes,
        ausentes,
        licencias,
        porcentaje: totalSesiones > 0 ? Math.round((presentes / totalSesiones) * 100) : 0,
        ultimas_sesiones: insc.asistencias.slice(0, 10).reverse().map((a) => ({
          fecha: a.sesion.fecha,
          estado: a.estado,
          tipo: a.sesion.tipo,
          tema: a.sesion.tema?.titulo ?? null,
        })),
      };
    }));
  } catch (e) { return handleError(e); }
}
