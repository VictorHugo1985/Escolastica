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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    const clase = await prisma.clases.findUnique({
      where: { id: params.id },
      include: {
        materia: true,
        instructor: { select: { id: true, nombre_completo: true, email: true } },
        horarios: { include: { aula: true }, orderBy: { dia_semana: 'asc' } },
        inscripciones: { where: { estado: 'Activo' }, include: { usuario: { select: { id: true, nombre_completo: true, email: true } } } },
        _count: { select: { sesiones: true } },
      },
    });
    if (!clase) throw new ApiError('Clase no encontrada', 404);
    return json(clase);
  } catch (e) { return handleError(e); }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const data = await req.json();
    const before = await prisma.clases.findUnique({ where: { id: params.id } });
    if (!before) throw new ApiError('Clase no encontrada', 404);

    let codigo = before.codigo;
    if (data.materia_id || data.mes_inicio !== undefined || data.anio_inicio !== undefined) {
      const materiaId = data.materia_id || before.materia_id;
      const mes = data.mes_inicio ?? before.mes_inicio;
      const anio = data.anio_inicio ?? before.anio_inicio;
      const materia = await prisma.materias.findUnique({ where: { id: materiaId } });
      codigo = await generateCodigo(materia!.nombre, mes, anio, data.paralelo);
    }

    const updated = await prisma.clases.update({
      where: { id: params.id },
      data: {
        ...(data.materia_id && { materia_id: data.materia_id }),
        ...(data.instructor_id && { instructor_id: data.instructor_id }),
        ...(data.mes_inicio !== undefined && { mes_inicio: data.mes_inicio }),
        ...(data.anio_inicio !== undefined && { anio_inicio: data.anio_inicio }),
        ...(data.celador && { celador: data.celador }),
        ...(data.fecha_inicio && { fecha_inicio: new Date(data.fecha_inicio) }),
        ...(data.fecha_fin && { fecha_fin: new Date(data.fecha_fin) }),
        ...(data.comentarios !== undefined && { comentarios: data.comentarios }),
        codigo,
      },
    });
    await auditLog({ usuario_id: actor.sub, accion: 'UPDATE', tabla_afectada: 'clases', valor_anterior: { id: params.id, codigo: before.codigo }, valor_nuevo: { id: params.id, ...data, codigo } });
    return json(updated);
  } catch (e) { return handleError(e); }
}
