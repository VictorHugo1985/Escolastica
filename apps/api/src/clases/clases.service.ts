import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { UsersService } from '../users/users.service';
import type {
  CreateClaseDto,
  UpdateClaseDto,
  ChangeClaseStatusDto,
  CreateHorarioDto,
  CreateInscripcionDto,
  BajaInscripcionDto,
} from '@escolastica/shared';

@Injectable()
export class ClasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly usersService: UsersService,
  ) {}

  findAll(filters: {
    materia_id?: string;
    instructor_id?: string;
    estado?: string;
    anio_inicio?: number;
    mes_inicio?: number;
  } = {}) {
    return this.prisma.clases.findMany({
      where: {
        ...(filters.materia_id && { materia_id: filters.materia_id }),
        ...(filters.instructor_id && { instructor_id: filters.instructor_id }),
        ...(filters.estado && { estado: filters.estado as any }),
        ...(filters.anio_inicio && { anio_inicio: filters.anio_inicio }),
        ...(filters.mes_inicio && { mes_inicio: filters.mes_inicio }),
      },
      include: {
        materia: { select: { id: true, nombre: true, nivel: true } },
        instructor: { select: { id: true, nombre_completo: true, email: true } },
        horarios: { include: { aula: { select: { id: true, nombre: true } } }, orderBy: { dia_semana: 'asc' } },
        _count: { select: { inscripciones: true, sesiones: true } },
      },
      orderBy: [{ anio_inicio: 'desc' }, { mes_inicio: 'desc' }],
    });
  }

  async findOne(id: string) {
    const clase = await this.prisma.clases.findUnique({
      where: { id },
      include: {
        materia: true,
        instructor: { select: { id: true, nombre_completo: true, email: true } },
        horarios: { include: { aula: true }, orderBy: { dia_semana: 'asc' } },
        inscripciones: {
          where: { estado: 'Activo' },
          include: { usuario: { select: { id: true, nombre_completo: true, email: true } } },
        },
        _count: { select: { sesiones: true } },
      },
    });
    if (!clase) throw new NotFoundException(`Clase ${id} no encontrada`);
    return clase;
  }

  async create(actorId: string, data: CreateClaseDto) {
    const instructores = await this.usersService.getEligibleInstructors();
    if (!instructores.some((i) => i.id === data.instructor_id)) {
      throw new BadRequestException('El usuario seleccionado no es un Instructor activo');
    }

    const materia = await this.prisma.materias.findUnique({ where: { id: data.materia_id } });
    if (!materia) throw new NotFoundException(`Materia ${data.materia_id} no encontrada`);

    const codigo = await this.generateCodigo(materia.nombre, data.mes_inicio, data.anio_inicio, data.paralelo);

    const clase = await this.prisma.$transaction(async (tx) => {
      const createdClase = await tx.clases.create({
        data: {
          materia_id: data.materia_id,
          instructor_id: data.instructor_id,
          codigo,
          mes_inicio: data.mes_inicio,
          anio_inicio: data.anio_inicio,
          celador: data.celador,
          fecha_inicio: new Date(data.fecha_inicio),
          fecha_fin: new Date(data.fecha_fin),
        },
        include: {
          materia: { select: { id: true, nombre: true } },
          instructor: { select: { id: true, nombre_completo: true } },
        },
      });

      await tx.horarios.create({
        data: {
          clase_id: createdClase.id,
          dia_semana: data.horario.dia_semana,
          hora_inicio: new Date(`1970-01-01T${data.horario.hora_inicio}:00.000Z`),
          hora_fin: new Date(`1970-01-01T${data.horario.hora_fin}:00.000Z`),
          aula_id: data.horario.aula_id || null,
        },
      });

      return createdClase;
    });

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'INSERT',
      tabla_afectada: 'clases',
      valor_nuevo: {
        id: clase.id,
        codigo: clase.codigo,
        materia: materia.nombre,
        horario: { dia_semana: data.horario.dia_semana, hora_inicio: data.horario.hora_inicio, hora_fin: data.horario.hora_fin },
      },
    });

    return clase;
  }

  async update(actorId: string, id: string, data: UpdateClaseDto) {
    const before = await this.findOne(id);

    // Si cambia el instructor, validar que sea elegible
    if (data.instructor_id && data.instructor_id !== before.instructor_id) {
      const instructores = await this.usersService.getEligibleInstructors();
      if (!instructores.some((i) => i.id === data.instructor_id)) {
        throw new BadRequestException('El nuevo usuario seleccionado no es un Instructor activo');
      }
    }

    // Determinar si necesitamos regenerar el código
    let nuevoCodigo = before.codigo;
    const materiaId = data.materia_id || before.materia_id;
    const mes = data.mes_inicio !== undefined ? data.mes_inicio : before.mes_inicio;
    const anio = data.anio_inicio !== undefined ? data.anio_inicio : before.anio_inicio;
    const paralelo = data.paralelo !== undefined ? data.paralelo : (before as any).paralelo; // Asumiendo que paralelo existe en el modelo real o se maneja vía código

    if (
      (data.materia_id && data.materia_id !== before.materia_id) ||
      (data.mes_inicio !== undefined && data.mes_inicio !== before.mes_inicio) ||
      (data.anio_inicio !== undefined && data.anio_inicio !== before.anio_inicio) ||
      (data.paralelo !== undefined)
    ) {
      const materia = await this.prisma.materias.findUnique({ where: { id: materiaId } });
      nuevoCodigo = await this.generateCodigo(materia.nombre, mes, anio, paralelo);
    }

    const updated = await this.prisma.clases.update({
      where: { id },
      data: {
        ...(data.materia_id && { materia_id: data.materia_id }),
        ...(data.instructor_id && { instructor_id: data.instructor_id }),
        ...(data.mes_inicio !== undefined && { mes_inicio: data.mes_inicio }),
        ...(data.anio_inicio !== undefined && { anio_inicio: data.anio_inicio }),
        ...(data.celador && { celador: data.celador }),
        ...(data.fecha_inicio && { fecha_inicio: new Date(data.fecha_inicio) }),
        ...(data.fecha_fin && { fecha_fin: new Date(data.fecha_fin) }),
        ...(data.comentarios !== undefined && { comentarios: data.comentarios }),
        codigo: nuevoCodigo,
      },
    });

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'UPDATE',
      tabla_afectada: 'clases',
      valor_anterior: { id, codigo: before.codigo, celador: before.celador },
      valor_nuevo: { id, ...data, codigo: nuevoCodigo },
    });

    return updated;
  }

  async changeStatus(actorId: string, id: string, dto: ChangeClaseStatusDto) {
    const before = await this.findOne(id);

    const updated = await this.prisma.clases.update({
      where: { id },
      data: { estado: dto.estado },
    });

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'UPDATE',
      tabla_afectada: 'clases',
      valor_anterior: { id, estado: before.estado },
      valor_nuevo: { id, estado: dto.estado },
    });

    return updated;
  }

  // --- Horarios ---

  findHorarios(claseId: string) {
    return this.prisma.horarios.findMany({
      where: { clase_id: claseId },
      include: { aula: true },
      orderBy: [{ dia_semana: 'asc' }, { hora_inicio: 'asc' }],
    });
  }

  async createHorario(claseId: string, data: CreateHorarioDto) {
    await this.findOne(claseId);

    const horaInicio = new Date(`1970-01-01T${data.hora_inicio}:00.000Z`);
    const horaFin = new Date(`1970-01-01T${data.hora_fin}:00.000Z`);

    const warnings: string[] = [];

    if (data.aula_id) {
      const conflict = await this.prisma.horarios.findFirst({
        where: {
          aula_id: data.aula_id,
          dia_semana: data.dia_semana,
          NOT: { clase_id: claseId },
          AND: [
            { hora_inicio: { lt: horaFin } },
            { hora_fin: { gt: horaInicio } },
          ],
        },
        include: { clase: { select: { codigo: true } } },
      });
      if (conflict) {
        warnings.push(`Conflicto de aula con clase ${conflict.clase.codigo} en el mismo horario`);
      }
    }

    const horario = await this.prisma.horarios.create({
      data: {
        clase_id: claseId,
        dia_semana: data.dia_semana,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        aula_id: data.aula_id,
      },
      include: { aula: true },
    });

    return { ...horario, warnings };
  }

  async deleteHorario(claseId: string, horarioId: string) {
    const horario = await this.prisma.horarios.findFirst({
      where: { id: horarioId, clase_id: claseId },
    });
    if (!horario) throw new NotFoundException('Horario no encontrado');
    await this.prisma.horarios.delete({ where: { id: horarioId } });
  }

  // --- Inscripciones ---

  findInscripcionesHistorial(claseId: string) {
    return this.prisma.inscripciones.findMany({
      where: { clase_id: claseId },
      include: {
        usuario: { select: { id: true, nombre_completo: true, email: true } },
      },
      orderBy: [{ estado: 'asc' }, { fecha_inscripcion: 'asc' }],
    });
  }

  findInscripciones(claseId: string) {
    return this.prisma.inscripciones.findMany({
      where: { clase_id: claseId, estado: 'Activo' },
      include: { usuario: { select: { id: true, nombre_completo: true, email: true, roles: { include: { rol: true } } } } },
      orderBy: { fecha_inscripcion: 'asc' },
    });
  }

  async createInscripcion(actorId: string, claseId: string, dto: CreateInscripcionDto) {
    const clase = await this.findOne(claseId);

    if (clase.estado === 'Finalizada') {
      throw new ConflictException('No se puede inscribir en una clase Finalizada');
    }

    const dup = await this.prisma.inscripciones.findUnique({
      where: { usuario_id_clase_id: { usuario_id: dto.usuario_id, clase_id: claseId } },
    });
    if (dup && dup.estado === 'Activo') {
      throw new ConflictException('El usuario ya está inscrito en esta clase');
    }

    if (clase.instructor_id === dto.usuario_id) {
      throw new ConflictException('El instructor titular no puede inscribirse como alumno en su propia clase');
    }

    const user = await this.prisma.usuarios.findUnique({
      where: { id: dto.usuario_id },
      include: { roles: { include: { rol: true } } },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const userRoleNames = user.roles.map((r) => r.rol.nombre);
    if (userRoleNames.includes('Probacionista') && !clase.materia.es_curso_probacion) {
      throw new ConflictException('Los Probacionistas solo pueden inscribirse en materias de probación');
    }
    if (clase.materia.es_curso_probacion && !userRoleNames.includes('Probacionista')) {
      throw new ConflictException('Esta materia es de probación: solo pueden inscribirse usuarios con rol Probacionista');
    }

    const inscripcion = dup
      ? await this.prisma.inscripciones.update({
          where: { id: dup.id },
          data: { estado: 'Activo', fecha_baja: null, motivo_baja: null },
        })
      : await this.prisma.inscripciones.create({
          data: { usuario_id: dto.usuario_id, clase_id: claseId },
        });

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'INSERT',
      tabla_afectada: 'inscripciones',
      valor_nuevo: { inscripcion_id: inscripcion.id, usuario_id: dto.usuario_id, clase_id: claseId },
    });

    return inscripcion;
  }

  async bajaInscripcion(actorId: string, claseId: string, inscripcionId: string, dto: BajaInscripcionDto) {
    const inscripcion = await this.prisma.inscripciones.findFirst({
      where: { id: inscripcionId, clase_id: claseId },
    });
    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

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
      valor_anterior: { id: inscripcionId, estado: inscripcion.estado },
      valor_nuevo: { id: inscripcionId, estado: 'Baja', motivo: dto.motivo_baja },
    });

    return updated;
  }

  // --- Private helpers ---

  private async generateCodigo(materiaNombre: string, mes: number, anio: number, paralelo?: string): Promise<string> {
    const base = materiaNombre
      .toUpperCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 20);

    const mesStr = String(mes).padStart(2, '0');
    const suffix = paralelo ? `-${paralelo.toUpperCase()}` : '';
    const candidate = `${base}-${mesStr}-${anio}${suffix}`;

    const existing = await this.prisma.clases.findUnique({ where: { codigo: candidate } });
    if (!existing) return candidate;

    for (let i = 2; i <= 26; i++) {
      const letter = String.fromCharCode(64 + i);
      const alt = `${base}-${mesStr}-${anio}-${letter}`;
      const altExists = await this.prisma.clases.findUnique({ where: { codigo: alt } });
      if (!altExists) return alt;
    }

    return `${candidate}-${Date.now()}`;
  }
}
