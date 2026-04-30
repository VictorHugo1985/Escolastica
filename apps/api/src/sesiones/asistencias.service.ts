import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { BulkAsistenciaDto, UpdateAsistenciaDto } from '@escolastica/shared';

@Injectable()
export class AsistenciasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async findBySesion(claseId: string, sesionId: string) {
    const inscripciones = await this.prisma.inscripciones.findMany({
      where: { clase_id: claseId, estado: 'Activo' },
      include: {
        usuario: { select: { id: true, nombre_completo: true } },
        asistencias: { where: { sesion_id: sesionId } },
      },
    });

    return inscripciones.map((insc) => ({
      inscripcion_id: insc.id,
      usuario: insc.usuario,
      estado: insc.asistencias[0]?.estado ?? 'Ausente',
      asistencia_id: insc.asistencias[0]?.id ?? null,
    }));
  }

  async bulkUpsert(actorId: string, sesionId: string, dto: BulkAsistenciaDto) {
    const claseIdRow = await this.prisma.sesiones.findUnique({
      where: { id: sesionId },
      select: { clase_id: true },
    });

    // All active inscripciones for this clase
    const inscripciones = await this.prisma.inscripciones.findMany({
      where: { clase_id: claseIdRow!.clase_id, estado: 'Activo' },
      select: { id: true },
    });

    const payloadMap = new Map(dto.asistencias.map((a) => [a.inscripcion_id, a.estado]));

    await this.prisma.$transaction(
      inscripciones.map((insc) =>
        this.prisma.asistencias.upsert({
          where: { inscripcion_id_sesion_id: { inscripcion_id: insc.id, sesion_id: sesionId } },
          create: {
            inscripcion_id: insc.id,
            sesion_id: sesionId,
            estado: payloadMap.get(insc.id) ?? 'Ausente',
          },
          update: { estado: payloadMap.get(insc.id) ?? 'Ausente' },
        }),
      ),
    );
  }

  async updateOne(actorId: string, asistenciaId: string, dto: UpdateAsistenciaDto) {
    const existing = await this.prisma.asistencias.findUnique({ where: { id: asistenciaId } });
    const updated = await this.prisma.asistencias.update({
      where: { id: asistenciaId },
      data: { estado: dto.estado },
    });

    this.auditoria.log({
      usuario_id: actorId,
      accion: 'UPDATE',
      tabla_afectada: 'asistencias',
      valor_anterior: existing as Record<string, unknown>,
      valor_nuevo: updated as Record<string, unknown>,
    });

    return updated;
  }

  async calcularPorcentajePorAlumno(claseId: string) {
    const sesiones = await this.prisma.sesiones.count({ where: { clase_id: claseId } });

    const inscripciones = await this.prisma.inscripciones.findMany({
      where: { clase_id: claseId, estado: 'Activo' },
      include: {
        usuario: { select: { id: true, nombre_completo: true } },
        asistencias: {
          select: {
            estado: true,
            sesion: { select: { fecha: true, tipo: true, tema: { select: { titulo: true } } } },
          },
          orderBy: { sesion: { fecha: 'desc' } },
        },
      },
    });

    return inscripciones.map((insc) => {
      const presentes = insc.asistencias.filter((a) => a.estado === 'Presente').length;
      const ausentes = insc.asistencias.filter((a) => a.estado === 'Ausente').length;
      const licencias = insc.asistencias.filter((a) => a.estado === 'Licencia').length;
      const ultimas_sesiones = insc.asistencias.slice(0, 10).reverse().map((a) => ({
        fecha: a.sesion.fecha,
        estado: a.estado,
        tipo: a.sesion.tipo,
        tema: a.sesion.tema?.titulo ?? null,
      }));
      return {
        inscripcion_id: insc.id,
        usuario: insc.usuario,
        total_sesiones: sesiones,
        presentes,
        ausentes,
        licencias,
        porcentaje: sesiones > 0 ? Math.round((presentes / sesiones) * 100) : 0,
        ultimas_sesiones,
      };
    });
  }
}
