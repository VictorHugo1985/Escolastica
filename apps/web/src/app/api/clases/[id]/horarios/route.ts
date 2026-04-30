import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, json, handleError } from '@/lib/route';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    return json(await prisma.horarios.findMany({ where: { clase_id: params.id }, include: { aula: true }, orderBy: [{ dia_semana: 'asc' }, { hora_inicio: 'asc' }] }));
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const data = await req.json();
    const horaInicio = new Date(`1970-01-01T${data.hora_inicio}:00.000Z`);
    const horaFin = new Date(`1970-01-01T${data.hora_fin}:00.000Z`);
    const warnings: string[] = [];

    if (data.aula_id) {
      const conflict = await prisma.horarios.findFirst({
        where: { aula_id: data.aula_id, dia_semana: data.dia_semana, NOT: { clase_id: params.id }, AND: [{ hora_inicio: { lt: horaFin } }, { hora_fin: { gt: horaInicio } }] },
        include: { clase: { select: { codigo: true } } },
      });
      if (conflict) warnings.push(`Conflicto de aula con clase ${conflict.clase.codigo}`);
    }

    const horario = await prisma.horarios.create({
      data: { clase_id: params.id, dia_semana: data.dia_semana, hora_inicio: horaInicio, hora_fin: horaFin, aula_id: data.aula_id || null },
      include: { aula: true },
    });
    return json({ ...horario, warnings }, 201);
  } catch (e) { return handleError(e); }
}
