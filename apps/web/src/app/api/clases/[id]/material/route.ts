import { NextRequest } from 'next/server';
import { UpdateMaterialClaseSchema } from '@escolastica/shared';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, json, handleError } from '@/lib/route';
import { assertAccesoMaterial, parseBody, pagoInclude, serializarPago } from '@/lib/material-clase';

// Control de material de la clase: lista fija de inscritos con total y detalle de pagos
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    await assertAccesoMaterial(actor, params.id);

    const cabecera = await prisma.material_clase.findUnique({
      where: { clase_id: params.id },
      select: { id: true, comentarios: true, created_at: true },
    });

    const pagos = cabecera
      ? await prisma.pagos_material.findMany({
          where: { material_clase_id: cabecera.id },
          include: pagoInclude,
          orderBy: [{ fecha: 'desc' }, { created_at: 'desc' }],
        })
      : [];
    const pagosPorInscripcion = new Map<string, ReturnType<typeof serializarPago>[]>();
    for (const p of pagos) {
      const lista = pagosPorInscripcion.get(p.inscripcion_id) ?? [];
      lista.push(serializarPago(p));
      pagosPorInscripcion.set(p.inscripcion_id, lista);
    }

    // Inscritos activos + inscritos de baja que tienen pagos
    const inscripciones = await prisma.inscripciones.findMany({
      where: {
        clase_id: params.id,
        OR: [{ estado: 'Activo' }, { id: { in: Array.from(pagosPorInscripcion.keys()) } }],
      },
      select: { id: true, estado: true, usuario: { select: { id: true, nombre_completo: true } } },
    });

    const filas = inscripciones
      .map((insc) => {
        const pagosAlumno = pagosPorInscripcion.get(insc.id) ?? [];
        return {
          inscripcion_id: insc.id,
          usuario: insc.usuario,
          estado_inscripcion: insc.estado,
          total_pagado: sumar(pagosAlumno.map((p) => p.monto)),
          temas_sugeridos: pagosAlumno[0]?.temas ?? [],
          pagos: pagosAlumno,
        };
      })
      .sort((a, b) => {
        const activoA = a.estado_inscripcion === 'Activo' ? 0 : 1;
        const activoB = b.estado_inscripcion === 'Activo' ? 0 : 1;
        return activoA - activoB || a.usuario.nombre_completo.localeCompare(b.usuario.nombre_completo, 'es');
      });

    const activas = filas.filter((f) => f.estado_inscripcion === 'Activo');
    return json({
      cabecera,
      filas,
      total_clase: sumar(filas.map((f) => f.total_pagado)),
      alumnos_con_pagos: activas.filter((f) => f.pagos.length > 0).length,
      total_inscritos: activas.length,
    });
  } catch (e) { return handleError(e); }
}

// Comentario general de la cabecera (la crea si todavía no existe)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    await assertAccesoMaterial(actor, params.id);
    const { comentarios } = parseBody(UpdateMaterialClaseSchema, await req.json());

    const before = await prisma.material_clase.findUnique({ where: { clase_id: params.id } });
    const cabecera = await prisma.material_clase.upsert({
      where: { clase_id: params.id },
      create: { clase_id: params.id, comentarios, creado_por: actor.sub },
      update: { comentarios },
      select: { id: true, comentarios: true, created_at: true },
    });
    await auditLog({
      usuario_id: actor.sub,
      accion: 'UPDATE',
      tabla_afectada: 'material_clase',
      valor_anterior: { id: cabecera.id, clase_id: params.id, comentarios: before?.comentarios ?? null },
      valor_nuevo: { id: cabecera.id, clase_id: params.id, comentarios },
    });
    return json(cabecera);
  } catch (e) { return handleError(e); }
}

// Suma en décimas para evitar errores de coma flotante
function sumar(montos: number[]): number {
  return montos.reduce((acc, m) => acc + Math.round(m * 10), 0) / 10;
}
