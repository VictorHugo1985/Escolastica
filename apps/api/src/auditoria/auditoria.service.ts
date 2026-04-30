import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaPayload } from '@escolastica/shared';

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(payload: AuditoriaPayload): Promise<void> {
    try {
      await this.prisma.logs_auditoria.create({
        data: {
          usuario_id: payload.usuario_id,
          accion: payload.accion,
          tabla_afectada: payload.tabla_afectada,
          valor_anterior: (payload.valor_anterior ?? undefined) as any,
          valor_nuevo: (payload.valor_nuevo ?? undefined) as any,
        },
      });
    } catch (error) {
      this.logger.error('Error al registrar log de auditoría', error);
    }
  }

  async findAll(filters: {
    tabla_afectada?: string;
    usuario_id?: string;
    accion?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    page: number;
    limit: number;
  }) {
    const { page, limit, tabla_afectada, usuario_id, accion, fechaDesde, fechaHasta } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(tabla_afectada && { tabla_afectada }),
      ...(usuario_id && { usuario_id }),
      ...(accion && { accion }),
      ...((fechaDesde || fechaHasta) && {
        created_at: {
          ...(fechaDesde && { gte: new Date(fechaDesde) }),
          ...(fechaHasta && { lte: new Date(fechaHasta + 'T23:59:59Z') }),
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.logs_auditoria.findMany({
        where,
        include: { usuario: { select: { id: true, nombre_completo: true } } },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.logs_auditoria.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findByEntity(entidad: string, entidadId: string) {
    return this.prisma.logs_auditoria.findMany({
      where: {
        tabla_afectada: entidad,
        OR: [
          { valor_nuevo: { path: ['id'], equals: entidadId } },
          { valor_anterior: { path: ['id'], equals: entidadId } },
        ],
      },
      include: { usuario: { select: { id: true, nombre_completo: true } } },
      orderBy: { created_at: 'desc' },
    });
  }
}
