import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  NotificacionPayload,
  NotificacionDto,
  GetNotificacionesResponseDto,
  GetHistorialResponseDto,
  TipoNotificacion,
} from '@escolastica/shared';

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registrar(payload: NotificacionPayload): Promise<void> {
    try {
      const descripcion = this.buildDescripcion(payload);

      // Un pase de lista repetido (mismo día, mismo actor, misma clase) actualiza
      // la notificación existente en vez de acumular una alerta por cada guardado
      if (payload.tipo === 'pase_de_lista') {
        const inicioDia = new Date();
        inicioDia.setHours(0, 0, 0, 0);
        const existente = await this.prisma.notificaciones_actividad.findFirst({
          where: {
            tipo: payload.tipo,
            actor_id: payload.actor_id,
            clase_id: payload.clase_id,
            created_at: { gte: inicioDia },
          },
        });
        if (existente) {
          await this.prisma.notificaciones_actividad.update({
            where: { id: existente.id },
            data: { descripcion, created_at: new Date() },
          });
          return;
        }
      }

      await this.prisma.notificaciones_actividad.create({
        data: {
          tipo: payload.tipo,
          descripcion,
          actor_id: payload.actor_id,
          clase_id: 'clase_id' in payload ? payload.clase_id : undefined,
          usuario_afectado_id:
            'usuario_afectado_id' in payload ? payload.usuario_afectado_id : undefined,
        },
      });
    } catch (error) {
      this.logger.error('Error al registrar notificación', error);
    }
  }

  async getRecientes(usuarioId: string): Promise<GetNotificacionesResponseDto> {
    const [notificaciones, ultimaVista] = await Promise.all([
      this.prisma.notificaciones_actividad.findMany({
        orderBy: { created_at: 'desc' },
        take: 20,
        include: {
          actor: { select: { id: true, nombre_completo: true } },
          clase: { include: { materia: { select: { nombre: true } } } },
          usuario_afectado: { select: { id: true, nombre_completo: true } },
        },
      }),
      this.prisma.notificaciones_ultima_vista.findUnique({
        where: { usuario_id: usuarioId },
      }),
    ]);

    const total_no_leidas = ultimaVista
      ? await this.prisma.notificaciones_actividad.count({
          where: { created_at: { gt: ultimaVista.ultima_vista } },
        })
      : await this.prisma.notificaciones_actividad.count();

    return {
      notificaciones: notificaciones.map(this.toDto),
      total_no_leidas,
    };
  }

  async getHistorial(filters: {
    tipo?: string;
    page: number;
    limit: number;
  }): Promise<GetHistorialResponseDto> {
    const { tipo, page, limit } = filters;
    const skip = (page - 1) * limit;
    const where = tipo ? { tipo } : {};

    const [notificaciones, total] = await Promise.all([
      this.prisma.notificaciones_actividad.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          actor: { select: { id: true, nombre_completo: true } },
          clase: { include: { materia: { select: { nombre: true } } } },
          usuario_afectado: { select: { id: true, nombre_completo: true } },
        },
      }),
      this.prisma.notificaciones_actividad.count({ where }),
    ]);

    return {
      notificaciones: notificaciones.map(this.toDto),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async marcarLeidas(usuarioId: string): Promise<void> {
    await this.prisma.notificaciones_ultima_vista.upsert({
      where: { usuario_id: usuarioId },
      create: { usuario_id: usuarioId, ultima_vista: new Date() },
      update: { ultima_vista: new Date() },
    });
  }

  private buildDescripcion(payload: NotificacionPayload): string {
    switch (payload.tipo) {
      case 'pase_de_lista':
        return `${payload.nombre_actor} pasó lista en ${payload.nombre_clase}: ${payload.total_presentes} asistente${payload.total_presentes !== 1 ? 's' : ''}`;
      case 'baja_inscrito':
        return `${payload.nombre_actor} dio de baja a ${payload.nombre_afectado} de ${payload.nombre_clase}`;
      case 'promocion_miembro':
        return `${payload.nombre_actor} promovió a ${payload.nombre_afectado} a Miembro`;
    }
  }

  private toDto(n: {
    id: string;
    tipo: string;
    descripcion: string;
    actor: { id: string; nombre_completo: string } | null;
    clase: ({ id: string; codigo: string; materia: { nombre: string } } & Record<string, unknown>) | null;
    usuario_afectado: { id: string; nombre_completo: string } | null;
    created_at: Date;
  }): NotificacionDto {
    return {
      id: n.id,
      tipo: n.tipo as TipoNotificacion,
      descripcion: n.descripcion,
      actor: n.actor,
      clase: n.clase
        ? { id: n.clase.id, codigo: n.clase.codigo, materia: n.clase.materia.nombre }
        : null,
      usuario_afectado: n.usuario_afectado,
      created_at: n.created_at.toISOString(),
    };
  }
}
