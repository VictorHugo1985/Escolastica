import { NextRequest } from 'next/server';
import { CreatePagoMaterialSchema } from '@escolastica/shared';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, json, handleError, ApiError } from '@/lib/route';
import {
  assertAccesoMaterial, assertTemasDeMateria, parseBody, pagoInclude, serializarPago, snapshotPago,
} from '@/lib/material-clase';

// Agrega un pago a un alumno; la cabecera de material de la clase se crea con el primer pago
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    const clase = await assertAccesoMaterial(actor, params.id);
    const dto = parseBody(CreatePagoMaterialSchema, await req.json());

    const inscripcion = await prisma.inscripciones.findUnique({
      where: { id: dto.inscripcion_id },
      select: { clase_id: true, estado: true },
    });
    if (!inscripcion || inscripcion.clase_id !== params.id || inscripcion.estado !== 'Activo') {
      throw new ApiError('La inscripción no está activa en esta clase', 400);
    }
    await assertTemasDeMateria(dto.tema_ids, clase.materia_id);

    const pago = await prisma.$transaction(async (tx) => {
      const cabecera = await tx.material_clase.upsert({
        where: { clase_id: params.id },
        create: { clase_id: params.id, creado_por: actor.sub },
        update: {},
      });
      return tx.pagos_material.create({
        data: {
          material_clase_id: cabecera.id,
          inscripcion_id: dto.inscripcion_id,
          fecha: new Date(dto.fecha),
          monto: dto.monto,
          comentarios: dto.comentarios ?? null,
          registrado_por: actor.sub,
          temas: { create: dto.tema_ids.map((tema_id) => ({ tema_id })) },
        },
        include: pagoInclude,
      });
    });

    await auditLog({ usuario_id: actor.sub, accion: 'INSERT', tabla_afectada: 'pagos_material', valor_nuevo: snapshotPago(pago) });
    return json(serializarPago(pago), 201);
  } catch (e) { return handleError(e); }
}
