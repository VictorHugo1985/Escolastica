import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSesionDto, UpdateSesionDto } from '@escolastica/shared';

@Injectable()
export class SesionesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByClase(claseId: string) {
    return this.prisma.sesiones.findMany({
      where: { clase_id: claseId },
      orderBy: { fecha: 'desc' },
      include: {
        tema: { select: { id: true, titulo: true } },
        _count: { select: { asistencias: { where: { estado: 'Presente' } } } },
      },
    });
  }

  async createSesion(dto: CreateSesionDto) {
    const fecha = dto.fecha ? new Date(dto.fecha) : new Date();
    return this.prisma.sesiones.create({
      data: {
        clase_id: dto.clase_id,
        fecha,
        tipo: dto.tipo ?? 'Clase',
        tema_id: dto.tema_id ?? null,
        comentarios: dto.comentarios ?? null,
      },
    });
  }

  async getOrCreateToday(claseId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await this.prisma.sesiones.findFirst({
      where: {
        clase_id: claseId,
        fecha: { gte: today, lt: tomorrow },
      },
    });
    if (existing) return existing;

    return this.prisma.sesiones.create({
      data: {
        clase_id: claseId,
        fecha: today,
        tipo: 'Clase',
      },
    });
  }

  async findOne(sesionId: string) {
    const sesion = await this.prisma.sesiones.findUnique({
      where: { id: sesionId },
      include: { tema: { select: { id: true, titulo: true } } },
    });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    return sesion;
  }

  async updateSesion(sesionId: string, dto: UpdateSesionDto) {
    return this.prisma.sesiones.update({
      where: { id: sesionId },
      data: {
        ...(dto.tipo !== undefined && { tipo: dto.tipo }),
        ...(dto.tema_id !== undefined && { tema_id: dto.tema_id }),
        ...(dto.comentarios !== undefined && { comentarios: dto.comentarios }),
        ...(dto.fecha !== undefined && { fecha: new Date(dto.fecha) }),
      },
    });
  }

  async deleteSesion(sesionId: string) {
    const sesion = await this.prisma.sesiones.findUnique({ where: { id: sesionId } });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    await this.prisma.asistencias.deleteMany({ where: { sesion_id: sesionId } });
    await this.prisma.sesiones.delete({ where: { id: sesionId } });
  }

  async findClasesHoy(userId: string, roles: string[], fecha?: string) {
    const target = fecha ? new Date(fecha + 'T12:00:00') : new Date();
    const diaSemana = target.getDay(); // 0 = Domingo, 6 = Sábado
    const esEscol = roles.includes('Escolastico');

    if (esEscol) {
      // Escolástico: todas las clases activas del sistema, sin filtro por horario ni instructor
      return this.prisma.clases.findMany({
        where: { estado: 'Activa' },
        include: {
          materia: { select: { id: true, nombre: true } },
          instructor: { select: { id: true, nombre_completo: true } },
          horarios: true,
          _count: { select: { inscripciones: { where: { estado: 'Activo' } } } },
        },
        orderBy: [{ materia: { nombre: 'asc' } }],
      });
    }

    // Instructor: solo sus clases con horario en el día de hoy
    return this.prisma.clases.findMany({
      where: {
        instructor_id: userId,
        estado: 'Activa',
        horarios: { some: { dia_semana: diaSemana } },
      },
      include: {
        materia: { select: { id: true, nombre: true } },
        instructor: { select: { id: true, nombre_completo: true } },
        horarios: { where: { dia_semana: diaSemana } },
        _count: { select: { inscripciones: { where: { estado: 'Activo' } } } },
      },
    });
  }
}
