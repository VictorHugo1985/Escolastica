import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, json, handleError } from '@/lib/route';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');

    const clases = await prisma.clases.findMany({
      where: { instructor_id: params.id },
      include: {
        materia: { select: { nombre: true, nivel: true } },
        inscripciones: { where: { estado: 'Activo' }, include: { asistencias: { select: { estado: true } } } },
        sesiones: { include: { asistencias: { select: { estado: true } } }, orderBy: { fecha: 'asc' } },
      },
      orderBy: [{ estado: 'asc' }, { materia: { nombre: 'asc' } }],
    });

    return json(clases.map((clase) => {
      const totalAlumnos = clase.inscripciones.length;
      const totalSesiones = clase.sesiones.length;
      const pctPorAlumno = clase.inscripciones.map((insc) => {
        const presentes = insc.asistencias.filter((a) => a.estado === 'Presente').length;
        return totalSesiones > 0 ? Math.round((presentes / totalSesiones) * 100) : 0;
      });
      const promedio = pctPorAlumno.length > 0 ? Math.round(pctPorAlumno.reduce((s, p) => s + p, 0) / pctPorAlumno.length) : 0;
      return {
        id: clase.id, codigo: clase.codigo, estado: clase.estado, materia: clase.materia,
        total_sesiones: totalSesiones, total_alumnos: totalAlumnos, promedio_asistencia: promedio,
        total_presencias: clase.inscripciones.reduce((sum, i) => sum + i.asistencias.filter((a) => a.estado === 'Presente').length, 0),
        total_posibles: totalSesiones * totalAlumnos,
        sesiones_historico: clase.sesiones.map((s) => {
          const presentes = s.asistencias.filter((a) => a.estado === 'Presente').length;
          return { fecha: s.fecha, presentes, total: totalAlumnos, porcentaje: totalAlumnos > 0 ? Math.round((presentes / totalAlumnos) * 100) : 0 };
        }),
      };
    }));
  } catch (e) { return handleError(e); }
}
