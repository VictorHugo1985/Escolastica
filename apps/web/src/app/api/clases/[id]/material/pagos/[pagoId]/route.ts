import { NextRequest, NextResponse } from 'next/server';
import { UpdatePagoMaterialSchema } from '@escolastica/shared';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, json, handleError, ApiError } from '@/lib/route';
import {
  assertAccesoMaterial, assertTemasDeMateria, parseBody, pagoInclude, serializarPago, snapshotPago,
} from '@/lib/material-clase';

type Params = { params: { id: string; pagoId: string } };

async function findPagoDeClase(pagoId: string, claseId: string) {
  const pago = await prisma.pagos_material.findUnique({ where: { id: pagoId }, include: pagoInclude });
  if (!pago || pago.material.clase_id !== claseId) throw new ApiError('Pago no encontrado', 404);
  return pago;
}

// Los pagos de inscripciones en Baja también se pueden corregir
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const actor = await requireAuth(req);
    const clase = await assertAccesoMaterial(actor, params.id);
    const dto = parseBody(UpdatePagoMaterialSchema, await req.json());
    const before = await findPagoDeClase(params.pagoId, params.id);
    if (dto.tema_ids) await assertTemasDeMateria(dto.tema_ids, clase.materia_id);

    const pago = await prisma.pagos_material.update({
      where: { id: params.pagoId },
      data: {
        ...(dto.fecha !== undefined && { fecha: new Date(dto.fecha) }),
        ...(dto.monto !== undefined && { monto: dto.monto }),
        ...(dto.comentarios !== undefined && { comentarios: dto.comentarios }),
        ...(dto.tema_ids !== undefined && {
          temas: { deleteMany: {}, create: dto.tema_ids.map((tema_id) => ({ tema_id })) },
        }),
      },
      include: pagoInclude,
    });

    await auditLog({
      usuario_id: actor.sub,
      accion: 'UPDATE',
      tabla_afectada: 'pagos_material',
      valor_anterior: snapshotPago(before),
      valor_nuevo: snapshotPago(pago),
    });
    return json(serializarPago(pago));
  } catch (e) { return handleError(e); }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const actor = await requireAuth(req);
    await assertAccesoMaterial(actor, params.id);
    const before = await findPagoDeClase(params.pagoId, params.id);

    await prisma.pagos_material.delete({ where: { id: params.pagoId } });
    await auditLog({ usuario_id: actor.sub, accion: 'DELETE', tabla_afectada: 'pagos_material', valor_anterior: snapshotPago(before) });
    return new NextResponse(null, { status: 204 });
  } catch (e) { return handleError(e); }
}
