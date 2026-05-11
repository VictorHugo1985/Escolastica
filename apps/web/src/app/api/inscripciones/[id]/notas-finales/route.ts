import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, json, handleError, ApiError } from '@/lib/route';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    const { tipo_nota, valor } = await req.json();

    const inscripcion = await prisma.inscripciones.findUnique({
      where: { id: params.id },
      include: { clase: { select: { instructor_id: true } } },
    });
    if (!inscripcion) throw new ApiError('Inscripción no encontrada', 404);

    const esEscol = actor.roles.includes('Escolastico');
    const esInstructor = inscripcion.clase.instructor_id === actor.sub;
    if (!esEscol && !esInstructor) throw new ApiError('Solo el instructor titular o un Escolástico puede registrar notas finales', 403);

    const [tipoValido, valorValido] = await Promise.all([
      prisma.enum_valores.findFirst({ where: { categoria: { nombre: 'TipoNotaFinal' }, codigo: tipo_nota, activo: true } }),
      prisma.enum_valores.findFirst({ where: { categoria: { nombre: 'EstadoNota' }, codigo: valor, activo: true } }),
    ]);
    if (!tipoValido) throw new ApiError('Tipo de nota inválido', 400);
    if (!valorValido) throw new ApiError('Valor de nota inválido', 400);

    let nota;
    try {
      nota = await prisma.notas_finales_inscripcion.create({
        data: { inscripcion_id: params.id, tipo_nota, valor },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ApiError('Ya existe una nota de ese tipo para esta inscripción', 409);
      throw e;
    }

    await auditLog({
      usuario_id: actor.sub,
      accion: 'CREATE',
      tabla_afectada: 'notas_finales_inscripcion',
      valor_anterior: null,
      valor_nuevo: { inscripcion_id: params.id, tipo_nota, valor },
    });

    return json(nota, 201);
  } catch (e) { return handleError(e); }
}
