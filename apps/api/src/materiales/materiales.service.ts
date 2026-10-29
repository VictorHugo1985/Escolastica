import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ZodType } from 'zod';
import {
  CreatePagoMaterialSchema,
  UpdatePagoMaterialSchema,
  UpdateMaterialClaseSchema,
  Rol,
} from '@escolastica/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';

interface Actor {
  id: string;
  roles: string[];
}

const pagoInclude = {
  material: { select: { clase_id: true } },
  temas: { include: { tema: { select: { id: true, titulo: true } } } },
  registrador: { select: { id: true, nombre_completo: true } },
} as const;

// Espejo de los route handlers de apps/web/src/app/api/clases/[id]/material (spec 032)
@Injectable()
export class MaterialesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async findControl(actor: Actor, claseId: string) {
    await this.assertAcceso(actor, claseId);

    const cabecera = await this.prisma.material_clase.findUnique({
      where: { clase_id: claseId },
      select: { id: true, comentarios: true, created_at: true },
    });
    const pagos = cabecera
      ? await this.prisma.pagos_material.findMany({
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

    const inscripciones = await this.prisma.inscripciones.findMany({
      where: {
        clase_id: claseId,
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
    return {
      cabecera,
      filas,
      total_clase: sumar(filas.map((f) => f.total_pagado)),
      alumnos_con_pagos: activas.filter((f) => f.pagos.length > 0).length,
      total_inscritos: activas.length,
    };
  }

  async updateCabecera(actor: Actor, claseId: string, body: unknown) {
    await this.assertAcceso(actor, claseId);
    const { comentarios } = parse(UpdateMaterialClaseSchema, body);

    const before = await this.prisma.material_clase.findUnique({ where: { clase_id: claseId } });
    const cabecera = await this.prisma.material_clase.upsert({
      where: { clase_id: claseId },
      create: { clase_id: claseId, comentarios, creado_por: actor.id },
      update: { comentarios },
      select: { id: true, comentarios: true, created_at: true },
    });
    await this.auditoria.log({
      usuario_id: actor.id,
      accion: 'UPDATE',
      tabla_afectada: 'material_clase',
      valor_anterior: { id: cabecera.id, clase_id: claseId, comentarios: before?.comentarios ?? null },
      valor_nuevo: { id: cabecera.id, clase_id: claseId, comentarios },
    });
    return cabecera;
  }

  async createPago(actor: Actor, claseId: string, body: unknown) {
    const clase = await this.assertAcceso(actor, claseId);
    const dto = parse(CreatePagoMaterialSchema, body);

    const inscripcion = await this.prisma.inscripciones.findUnique({
      where: { id: dto.inscripcion_id },
      select: { clase_id: true, estado: true },
    });
    if (!inscripcion || inscripcion.clase_id !== claseId || inscripcion.estado !== 'Activo') {
      throw new BadRequestException('La inscripción no está activa en esta clase');
    }
    await this.assertTemasDeMateria(dto.tema_ids, clase.materia_id);

    const pago = await this.prisma.$transaction(async (tx) => {
      const cabecera = await tx.material_clase.upsert({
        where: { clase_id: claseId },
        create: { clase_id: claseId, creado_por: actor.id },
        update: {},
      });
      return tx.pagos_material.create({
        data: {
          material_clase_id: cabecera.id,
          inscripcion_id: dto.inscripcion_id,
          fecha: new Date(dto.fecha),
          monto: dto.monto,
          comentarios: dto.comentarios ?? null,
          registrado_por: actor.id,
          temas: { create: dto.tema_ids.map((tema_id) => ({ tema_id })) },
        },
        include: pagoInclude,
      });
    });

    await this.auditoria.log({ usuario_id: actor.id, accion: 'INSERT', tabla_afectada: 'pagos_material', valor_nuevo: snapshotPago(pago) });
    return serializarPago(pago);
  }

  async updatePago(actor: Actor, claseId: string, pagoId: string, body: unknown) {
    const clase = await this.assertAcceso(actor, claseId);
    const dto = parse(UpdatePagoMaterialSchema, body);
    const before = await this.findPagoDeClase(pagoId, claseId);
    if (dto.tema_ids) await this.assertTemasDeMateria(dto.tema_ids, clase.materia_id);

    const pago = await this.prisma.pagos_material.update({
      where: { id: pagoId },
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

    await this.auditoria.log({
      usuario_id: actor.id,
      accion: 'UPDATE',
      tabla_afectada: 'pagos_material',
      valor_anterior: snapshotPago(before),
      valor_nuevo: snapshotPago(pago),
    });
    return serializarPago(pago);
  }

  async deletePago(actor: Actor, claseId: string, pagoId: string) {
    await this.assertAcceso(actor, claseId);
    const before = await this.findPagoDeClase(pagoId, claseId);
    await this.prisma.pagos_material.delete({ where: { id: pagoId } });
    await this.auditoria.log({ usuario_id: actor.id, accion: 'DELETE', tabla_afectada: 'pagos_material', valor_anterior: snapshotPago(before) });
  }

  // Instructor solo en sus clases; Escolástico en todas. Clases Inactiva excluidas
  private async assertAcceso(actor: Actor, claseId: string) {
    const clase = await this.prisma.clases.findUnique({
      where: { id: claseId },
      select: { id: true, materia_id: true, instructor_id: true, estado: true },
    });
    if (!clase) throw new NotFoundException('Clase no encontrada');
    if (clase.estado === 'Inactiva') throw new ConflictException('La clase está inactiva');
    if (!actor.roles.includes(Rol.Escolastico) && clase.instructor_id !== actor.id) {
      throw new ForbiddenException('Sin permisos suficientes');
    }
    return clase;
  }

  private async assertTemasDeMateria(temaIds: string[], materiaId: string) {
    if (temaIds.length === 0) return;
    const count = await this.prisma.temas.count({ where: { id: { in: temaIds }, materia_id: materiaId } });
    if (count !== new Set(temaIds).size) throw new BadRequestException('Tema no pertenece a la materia');
  }

  private async findPagoDeClase(pagoId: string, claseId: string) {
    const pago = await this.prisma.pagos_material.findUnique({ where: { id: pagoId }, include: pagoInclude });
    if (!pago || pago.material.clase_id !== claseId) throw new NotFoundException('Pago no encontrado');
    return pago;
  }
}

function parse<T>(schema: ZodType<T, any, any>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new BadRequestException(result.error.issues.map((i) => i.message));
  return result.data;
}

interface PagoConRelaciones {
  id: string;
  inscripcion_id: string;
  fecha: Date;
  monto: { toNumber(): number } | number;
  comentarios: string | null;
  material: { clase_id: string };
  temas: { tema: { id: string; titulo: string } }[];
  registrador: { id: string; nombre_completo: string } | null;
}

function serializarPago(pago: PagoConRelaciones) {
  return {
    id: pago.id,
    inscripcion_id: pago.inscripcion_id,
    fecha: pago.fecha.toISOString().split('T')[0],
    monto: Number(pago.monto),
    comentarios: pago.comentarios,
    temas: pago.temas.map((t) => t.tema),
    registrado_por: pago.registrador,
  };
}

function snapshotPago(pago: PagoConRelaciones) {
  return {
    id: pago.id,
    clase_id: pago.material.clase_id,
    inscripcion_id: pago.inscripcion_id,
    fecha: pago.fecha.toISOString().split('T')[0],
    monto: Number(pago.monto),
    comentarios: pago.comentarios,
    tema_ids: pago.temas.map((t) => t.tema.id),
  };
}

// Suma en décimas para evitar errores de coma flotante
function sumar(montos: number[]): number {
  return montos.reduce((acc, m) => acc + Math.round(m * 10), 0) / 10;
}
