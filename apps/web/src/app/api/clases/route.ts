import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

async function generateCodigo(materiaNombre: string, mes: number, anio: number, paralelo?: string) {
  const base = materiaNombre.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 20);
  const mesStr = String(mes).padStart(2, '0');
  const suffix = paralelo ? `-${paralelo.toUpperCase()}` : '';
  const candidate = `${base}-${mesStr}-${anio}${suffix}`;
  if (!await prisma.clases.findUnique({ where: { codigo: candidate } })) return candidate;
  for (let i = 2; i <= 26; i++) {
    const alt = `${base}-${mesStr}-${anio}-${String.fromCharCode(64 + i)}`;
    if (!await prisma.clases.findUnique({ where: { codigo: alt } })) return alt;
  }
  return `${candidate}-${Date.now()}`;
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    return json(await prisma.clases.findMany({
      where: {
        ...(searchParams.get('materia_id') && { materia_id: searchParams.get('materia_id')! }),
        ...(searchParams.get('instructor_id') && { instructor_id: searchParams.get('instructor_id')! }),
        ...(searchParams.get('estado') && { estado: searchParams.get('estado') as any }),
        ...(searchParams.get('anio_inicio') && { anio_inicio: Number(searchParams.get('anio_inicio')) }),
        ...(searchParams.get('mes_inicio') && { mes_inicio: Number(searchParams.get('mes_inicio')) }),
      },
      include: {
        materia: { select: { id: true, nombre: true, nivel: true } },
        instructor: { select: { id: true, nombre_completo: true, email: true } },
        horarios: { include: { aula: { select: { id: true, nombre: true } } }, orderBy: { dia_semana: 'asc' } },
        _count: { select: { inscripciones: true, sesiones: true } },
      },
      orderBy: [{ anio_inicio: 'desc' }, { mes_inicio: 'desc' }],
    }));
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const data = await req.json();

    const instructors = await prisma.usuarios.findMany({ where: { roles: { some: { rol: { nombre: 'Instructor' } } }, estado: 'Activo' }, select: { id: true } });
    if (!instructors.some((i) => i.id === data.instructor_id)) throw new ApiError('El usuario no es un Instructor activo', 400);

    const materia = await prisma.materias.findUnique({ where: { id: data.materia_id } });
    if (!materia) throw new ApiError('Materia no encontrada', 404);
    if (!data.horario) throw new ApiError('Datos de horario requeridos', 400);

    const codigo = await generateCodigo(materia.nombre, data.mes_inicio, data.anio_inicio, data.paralelo);

    const clase = await prisma.$transaction(async (tx) => {
      const c = await tx.clases.create({
        data: { materia_id: data.materia_id, instructor_id: data.instructor_id, codigo, mes_inicio: data.mes_inicio, anio_inicio: data.anio_inicio, celador: data.celador, fecha_inicio: new Date(data.fecha_inicio), fecha_fin: new Date(data.fecha_fin) },
        include: { materia: { select: { id: true, nombre: true } }, instructor: { select: { id: true, nombre_completo: true } } },
      });
      await tx.horarios.create({ data: { clase_id: c.id, dia_semana: data.horario.dia_semana, hora_inicio: new Date(`1970-01-01T${data.horario.hora_inicio}:00.000Z`), hora_fin: new Date(`1970-01-01T${data.horario.hora_fin}:00.000Z`), aula_id: data.horario.aula_id || null } });
      return c;
    });

    await auditLog({ usuario_id: actor.sub, accion: 'INSERT', tabla_afectada: 'clases', valor_nuevo: { id: clase.id, codigo: clase.codigo, materia: materia.nombre } });
    return json(clase, 201);
  } catch (e) { return handleError(e); }
}
