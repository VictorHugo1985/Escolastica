import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import type { BajaInscripcionDto, ConclusionInscripcionDto } from '@escolastica/shared';

@Injectable()
export class InscripcionesService {
  private readonly logger = new Logger(InscripcionesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  async findOne(id: string) {
    const insc = await this.prisma.inscripciones.findUnique({
      where: { id },
      include: {
        clase: {
          include: { materia: { select: { id: true, nombre: true } } },
        },
        usuario: { select: { id: true, nombre_completo: true } },
      },
    });
    if (!insc) throw new NotFoundException('Inscripción no encontrada');
    return insc;
  }

  getHistorialByUsuario(usuarioId: string) {
    return this.prisma.inscripciones.findMany({
      where: { usuario_id: usuarioId },
      include: {
        clase: {
          include: {
            materia: { select: { id: true, nombre: true } },
            instructor: { select: { id: true, nombre_completo: true } },
          },
        },
      },
      orderBy: { fecha_inscripcion: 'desc' },
    });
  }

  getHistorialByClase(claseId: string) {
    return this.prisma.inscripciones.findMany({
      where: { clase_id: claseId },
      include: {
        usuario: { select: { id: true, nombre_completo: true, email: true } },
      },
      orderBy: [{ estado: 'asc' }, { fecha_inscripcion: 'asc' }],
    });
  }

  async registrarBaja(actorId: string, inscripcionId: string, dto: BajaInscripcionDto) {
    const before = await this.findOne(inscripcionId);

    if (before.estado !== 'Activo') {
      throw new ConflictException(
        `No se puede dar de baja una inscripción con estado '${before.estado}'`,
      );
    }

    const updated = await this.prisma.inscripciones.update({
      where: { id: inscripcionId },
      data: {
        estado: 'Baja',
        fecha_baja: new Date(),
        motivo_baja: dto.motivo_baja as any,
        comentarios: dto.comentarios,
      },
    });

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'UPDATE',
      tabla_afectada: 'inscripciones',
      valor_anterior: { id: inscripcionId, estado: before.estado },
      valor_nuevo: { id: inscripcionId, estado: 'Baja', motivo: dto.motivo_baja },
    });

    // Fire-and-forget notification
    const actor = await this.prisma.usuarios.findUnique({
      where: { id: actorId },
      select: { nombre_completo: true },
    });
    const nombreClase = `${before.clase.materia.nombre} (${before.clase.codigo})`;

    this.notificaciones
      .registrar({
        tipo: 'baja_inscrito',
        actor_id: actorId,
        clase_id: before.clase_id,
        usuario_afectado_id: before.usuario_id,
        nombre_clase: nombreClase,
        nombre_actor: actor?.nombre_completo ?? 'Usuario eliminado',
        nombre_afectado: before.usuario.nombre_completo,
      })
      .catch((e) => this.logger.error('Error al registrar notificación de baja', e));

    return updated;
  }

  async marcarConclusion(
    actorId: string,
    actorRoles: string[],
    inscripcionId: string,
    dto: ConclusionInscripcionDto,
  ) {
    const before = await this.findOne(inscripcionId);

    const esEscol = actorRoles.includes('Escolastico');
    const esInstructor = before.clase.instructor_id === actorId;

    if (!esEscol && !esInstructor) {
      throw new ForbiddenException(
        'Solo el instructor titular o un Escolástico puede marcar la conclusión del temario',
      );
    }

    const updated = await this.prisma.inscripciones.update({
      where: { id: inscripcionId },
      data: {
        concluyo_temario_materia: dto.concluyo_temario_materia,
        fecha_conclusion_temario: dto.fecha_conclusion_temario
          ? new Date(dto.fecha_conclusion_temario)
          : dto.concluyo_temario_materia
            ? new Date()
            : null,
        ...(dto.comentarios !== undefined && { comentarios: dto.comentarios }),
      },
    });

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'UPDATE',
      tabla_afectada: 'inscripciones',
      valor_anterior: { id: inscripcionId, concluyo_temario_materia: before.concluyo_temario_materia },
      valor_nuevo: { id: inscripcionId, concluyo_temario_materia: dto.concluyo_temario_materia },
    });

    return updated;
  }
}
