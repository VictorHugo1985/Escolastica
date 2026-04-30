import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { EmailService } from '../auth/email.service';
import { CreateUserDto, UpdateUserDto, AddRoleDto, UpdateInterviewDto, Rol, ImportResultDto, FilaImportacionResultado } from '@escolastica/shared';
import { parse } from 'csv-parse/sync';
import * as ExcelJS from 'exceljs';
import type { Response } from 'express';

const BCRYPT_ROUNDS = 12;

// Roles que no pueden coexistir con ningún otro rol
const EXCLUSIVE_ROLES = ['Probacionista', 'ExProbacionista', 'ExMiembro'];

// Roles que habilitan acceso a la app web en el MVP
const ROLES_CON_ACCESO = ['Instructor', 'Escolastico'];

const ROLES_INCLUDE = { roles: { include: { rol: true } } };

function getRoleNames(user: { roles: { rol: { nombre: string } }[] }): string[] {
  return user.roles.map((r) => r.rol.nombre);
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly emailService: EmailService,
  ) {}

  async findAll(filters: { rol?: Rol; estado?: string; search?: string } = {}) {
    return this.prisma.usuarios.findMany({
      where: {
        ...(filters.rol && {
          roles: { some: { rol: { nombre: filters.rol } } },
        }),
        ...(filters.estado && { estado: filters.estado as any }),
        ...(filters.search && {
          OR: [
            { nombre_completo: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
      },
      include: ROLES_INCLUDE,
      orderBy: { nombre_completo: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.usuarios.findUnique({
      where: { id },
      include: ROLES_INCLUDE,
    });
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`);
    return user;
  }

  async create(actorId: string, data: CreateUserDto & { rolNombre?: string }) {
    const rolNombre = data.rolNombre ?? 'Probacionista';
    const rol = await this.prisma.roles.findUnique({ where: { nombre: rolNombre } });
    if (!rol) throw new BadRequestException(`Rol '${rolNombre}' no existe`);

    if (data.email) {
      const existing = await this.prisma.usuarios.findUnique({ where: { email: data.email } });
      if (existing) throw new ConflictException('El email ya está registrado');
    }

    if (data.ci) {
      const existingCi = await this.prisma.usuarios.findFirst({ where: { ci: data.ci } });
      if (existingCi) throw new ConflictException('El CI ya está registrado');
    }

    const userId = crypto.randomUUID();

    const user = await this.prisma.usuarios.create({
      data: {
        id: userId,
        email: data.email || undefined,
        nombre_completo: data.nombre_completo,
        genero: data.genero || undefined,
        fecha_nacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : undefined,
        telefono: data.telefono || undefined,
        ci: data.ci || undefined,
        foto_url: data.foto_url || undefined,
        fecha_inscripcion: (data as any).fecha_inscripcion
          ? new Date((data as any).fecha_inscripcion)
          : undefined,
        fecha_recibimiento: data.fecha_recibimiento
          ? new Date(data.fecha_recibimiento)
          : undefined,
      },
      include: ROLES_INCLUDE,
    });

    await this.prisma.usuario_roles.create({
      data: {
        usuario_id: userId,
        rol_id: rol.id,
        asignado_por_id: actorId,
      },
    });

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'INSERT',
      tabla_afectada: 'usuarios',
      valor_nuevo: { id: user.id, email: user.email, rol: rolNombre },
    });

    return this.findOne(userId);
  }

  async update(actorId: string, id: string, data: UpdateUserDto) {
    const before = await this.findOne(id);

    if (data.ci && data.ci !== before.ci) {
      const dup = await this.prisma.usuarios.findFirst({
        where: { ci: data.ci, NOT: { id } },
      });
      if (dup) throw new ConflictException('El CI ya está registrado por otro usuario');
    }

    if (data.email && data.email !== before.email) {
      const dup = await this.prisma.usuarios.findUnique({ where: { email: data.email } });
      if (dup) throw new ConflictException('El email ya está registrado por otro usuario');
    }

    const updated = await this.prisma.usuarios.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.nombre_completo && { nombre_completo: data.nombre_completo }),
        ...(data.genero !== undefined && { genero: data.genero || null }),
        ...(data.fecha_nacimiento && { fecha_nacimiento: new Date(data.fecha_nacimiento) }),
        ...(data.telefono !== undefined && { telefono: data.telefono || null }),
        ...(data.ci !== undefined && { ci: data.ci || null }),
        ...(data.foto_url !== undefined && { foto_url: data.foto_url || null }),
        ...((data as any).fecha_inscripcion !== undefined && {
          fecha_inscripcion: (data as any).fecha_inscripcion
            ? new Date((data as any).fecha_inscripcion)
            : null,
        }),
        ...(data.fecha_recibimiento && {
          fecha_recibimiento: new Date(data.fecha_recibimiento),
        }),
        ...(data.estado !== undefined && { estado: data.estado as any }),
      },
      include: ROLES_INCLUDE,
    });

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'UPDATE',
      tabla_afectada: 'usuarios',
      valor_anterior: { id: before.id, nombre_completo: before.nombre_completo, ci: before.ci },
      valor_nuevo: { id: updated.id, nombre_completo: updated.nombre_completo, ci: updated.ci },
    });

    return updated;
  }

  async addRole(actorId: string, id: string, dto: AddRoleDto) {
    const user = await this.findOne(id);
    const currentRoles = getRoleNames(user);

    if (currentRoles.includes(dto.rol)) {
      throw new ConflictException(`El usuario ya tiene el rol '${dto.rol}'`);
    }

    // ExMiembro: reemplaza todos los roles actuales y pasa al usuario a Inactivo
    if (dto.rol === 'ExMiembro') {
      const exMiembroRol = await this.prisma.roles.findUnique({ where: { nombre: 'ExMiembro' } });
      if (!exMiembroRol) throw new BadRequestException("Rol 'ExMiembro' no existe");

      await this.prisma.$transaction([
        this.prisma.usuario_roles.deleteMany({ where: { usuario_id: id } }),
        this.prisma.usuario_roles.create({
          data: { usuario_id: id, rol_id: exMiembroRol.id, asignado_por_id: actorId },
        }),
        this.prisma.usuarios.update({ where: { id }, data: { estado: 'Inactivo' } }),
      ]);

      await this.auditoria.log({
        usuario_id: actorId,
        accion: 'UPDATE',
        tabla_afectada: 'usuarios',
        valor_anterior: { id, roles: currentRoles, estado: user.estado },
        valor_nuevo: { id, rol: 'ExMiembro', estado: 'Inactivo' },
      });

      return this.findOne(id);
    }

    // Exclusivity: user has an exclusive role → cannot add any other
    if (currentRoles.some((r) => EXCLUSIVE_ROLES.includes(r))) {
      throw new BadRequestException(
        `Los roles ${EXCLUSIVE_ROLES.join(', ')} no pueden combinarse con otros roles`,
      );
    }

    // Exclusivity: the role being added is exclusive and user already has roles
    if (EXCLUSIVE_ROLES.includes(dto.rol) && currentRoles.length > 0) {
      throw new BadRequestException(
        `El rol '${dto.rol}' no puede combinarse con otros roles existentes`,
      );
    }

    const rol = await this.prisma.roles.findUnique({ where: { nombre: dto.rol } });
    if (!rol) throw new BadRequestException(`Rol '${dto.rol}' no existe`);

    await this.prisma.usuario_roles.create({
      data: {
        usuario_id: id,
        rol_id: rol.id,
        asignado_por_id: actorId,
      },
    });

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'INSERT',
      tabla_afectada: 'usuario_roles',
      valor_nuevo: { usuario_id: id, rol: dto.rol },
    });

    return this.findOne(id);
  }

  async removeRole(actorId: string, id: string, rolNombre: string) {
    const user = await this.findOne(id);
    const currentRoles = getRoleNames(user);

    if (!currentRoles.includes(rolNombre)) {
      throw new BadRequestException(`El usuario no tiene el rol '${rolNombre}'`);
    }

    if (currentRoles.length === 1) {
      throw new BadRequestException('No se puede quitar el único rol del usuario');
    }

    if (rolNombre === 'Instructor') {
      const activeClases = await this.prisma.clases.count({
        where: { instructor_id: id, estado: 'Activa' },
      });
      if (activeClases > 0) {
        throw new ConflictException(
          'No se puede quitar el rol de Instructor: tiene clases activas asignadas',
        );
      }
    }

    const rol = await this.prisma.roles.findUnique({ where: { nombre: rolNombre } });
    if (!rol) throw new BadRequestException(`Rol '${rolNombre}' no existe`);

    await this.prisma.usuario_roles.delete({
      where: { usuario_id_rol_id: { usuario_id: id, rol_id: rol.id } },
    });

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'DELETE',
      tabla_afectada: 'usuario_roles',
      valor_anterior: { usuario_id: id, rol: rolNombre },
    });

    return this.findOne(id);
  }

  async softDelete(actorId: string, id: string) {
    const user = await this.findOne(id);

    const activeClases = await this.prisma.clases.count({
      where: { instructor_id: id, estado: 'Activa' },
    });
    if (activeClases > 0) {
      throw new ConflictException(
        'No se puede desactivar: el usuario tiene clases activas como instructor',
      );
    }

    const updated = await this.prisma.usuarios.update({
      where: { id },
      data: { estado: 'Inactivo' },
      include: ROLES_INCLUDE,
    });

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'UPDATE',
      tabla_afectada: 'usuarios',
      valor_anterior: { id, estado: user.estado },
      valor_nuevo: { id, estado: 'Inactivo' },
    });

    return updated;
  }

  async promote(actorId: string, id: string) {
    const user = await this.findOne(id);
    const currentRoles = getRoleNames(user);

    if (!currentRoles.includes('Probacionista')) {
      throw new BadRequestException('Solo se pueden promover usuarios con rol Probacionista');
    }

    const probacionistaRol = await this.prisma.roles.findUnique({ where: { nombre: 'Probacionista' } });
    const miembroRol = await this.prisma.roles.findUnique({ where: { nombre: 'Miembro' } });
    if (!probacionistaRol || !miembroRol) throw new BadRequestException('Roles no encontrados');

    await this.prisma.$transaction([
      this.prisma.usuario_roles.delete({
        where: { usuario_id_rol_id: { usuario_id: id, rol_id: probacionistaRol.id } },
      }),
      this.prisma.usuario_roles.create({
        data: { usuario_id: id, rol_id: miembroRol.id, asignado_por_id: actorId },
      }),
    ]);

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'UPDATE',
      tabla_afectada: 'usuarios',
      valor_anterior: { id, rol: 'Probacionista' },
      valor_nuevo: { id, rol: 'Miembro' },
    });

    return this.findOne(id);
  }

  async findPendingApproval() {
    const probacionistas = await this.prisma.usuarios.findMany({
      where: { roles: { some: { rol: { nombre: 'Probacionista' } } } },
      include: {
        ...ROLES_INCLUDE,
        inscripciones: {
          where: {
            clase: {
              materia: { es_curso_probacion: true },
            },
          },
          orderBy: { fecha_inscripcion: 'desc' },
          take: 1,
          include: {
            clase: {
              include: {
                materia: { select: { nombre: true } },
                instructor: { select: { id: true, nombre_completo: true } },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    return probacionistas.map((u) => {
      const inscripcionRef = u.inscripciones[0] ?? null;
      const { inscripciones, ...rest } = u;
      return {
        ...rest,
        instructor_referencia: inscripcionRef
          ? {
              nombre_completo: inscripcionRef.clase.instructor.nombre_completo,
              estado_inscripcion: inscripcionRef.estado,
              materia: inscripcionRef.clase.materia.nombre,
            }
          : null,
      };
    });
  }

  async getEligibleInstructors() {
    return this.prisma.usuarios.findMany({
      where: {
        roles: { some: { rol: { nombre: 'Instructor' } } },
        estado: 'Activo',
      },
      select: { id: true, nombre_completo: true, email: true },
      orderBy: { nombre_completo: 'asc' },
    });
  }

  async validateInstructorRole(userId: string): Promise<void> {
    const user = await this.prisma.usuarios.findUnique({
      where: { id: userId },
      include: ROLES_INCLUDE,
    });
    if (!user) throw new NotFoundException(`Usuario ${userId} no encontrado`);
    if (!user.roles.some((r) => r.rol.nombre === 'Instructor')) {
      throw new BadRequestException(
        `El usuario "${user.nombre_completo}" no tiene el rol de Instructor`,
      );
    }
  }

  async changeOwnPassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.usuarios.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const valid = user.password_hash
      ? await bcrypt.compare(currentPassword, user.password_hash)
      : false;
    if (!valid) throw new BadRequestException('La contraseña actual es incorrecta');

    const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.usuarios.update({
      where: { id: userId },
      data: { password_hash: hash, must_change_password: false },
    });
  }

  async updateInterview(actorId: string, id: string, data: UpdateInterviewDto) {
    const user = await this.findOne(id);
    const currentRoles = getRoleNames(user);

    if (!currentRoles.includes('Probacionista')) {
      throw new BadRequestException('Solo se puede gestionar la entrevista de usuarios con rol Probacionista');
    }

    const updated = await this.prisma.usuarios.update({
      where: { id },
      data: {
        ...(data.fecha_entrevista !== undefined && {
          fecha_entrevista: data.fecha_entrevista ? new Date(data.fecha_entrevista) : null,
        }),
        ...(data.entrevista_completada !== undefined && {
          entrevista_completada: data.entrevista_completada,
        }),
      },
      include: ROLES_INCLUDE,
    });

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'UPDATE',
      tabla_afectada: 'usuarios',
      valor_anterior: {
        id,
        fecha_entrevista: user.fecha_entrevista,
        entrevista_completada: user.entrevista_completada,
      },
      valor_nuevo: {
        id,
        fecha_entrevista: updated.fecha_entrevista,
        entrevista_completada: updated.entrevista_completada,
      },
    });

    return updated;
  }

  async getEligibleStudents(claseId: string) {
    const clase = await this.prisma.clases.findUnique({
      where: { id: claseId },
      include: { materia: { select: { es_curso_probacion: true } } },
    });
    if (!clase) throw new NotFoundException(`Clase ${claseId} no encontrada`);

    const esProbacion = clase.materia.es_curso_probacion;

    if (esProbacion) {
      // Solo Probacionistas pueden inscribirse en cursos de probación
      return this.prisma.usuarios.findMany({
        where: {
          estado: 'Activo',
          id: { not: clase.instructor_id },
          roles: { some: { rol: { nombre: 'Probacionista' } } },
        },
        select: { id: true, nombre_completo: true, email: true },
        orderBy: { nombre_completo: 'asc' },
      });
    }

    // Clases normales: excluir Probacionistas, ExProbacionistas y el instructor
    return this.prisma.usuarios.findMany({
      where: {
        estado: 'Activo',
        id: { not: clase.instructor_id },
        NOT: { roles: { some: { rol: { nombre: { in: ['Probacionista', 'ExProbacionista'] } } } } },
      },
      select: { id: true, nombre_completo: true, email: true },
      orderBy: { nombre_completo: 'asc' },
    });
  }

  async markAsExProbacionista(actorId: string, id: string, comentario?: string) {
    const user = await this.findOne(id);
    const currentRoles = getRoleNames(user);

    if (!currentRoles.includes('Probacionista')) {
      throw new BadRequestException('Solo se pueden rechazar usuarios con rol Probacionista');
    }

    const probacionistaRol = await this.prisma.roles.findUnique({ where: { nombre: 'Probacionista' } });
    const exProbacionistaRol = await this.prisma.roles.findUnique({ where: { nombre: 'ExProbacionista' } });
    if (!probacionistaRol || !exProbacionistaRol) {
      throw new BadRequestException('Roles no encontrados en el sistema');
    }

    await this.prisma.$transaction([
      this.prisma.usuario_roles.delete({
        where: { usuario_id_rol_id: { usuario_id: id, rol_id: probacionistaRol.id } },
      }),
      this.prisma.usuario_roles.create({
        data: { usuario_id: id, rol_id: exProbacionistaRol.id, asignado_por_id: actorId },
      }),
      this.prisma.usuarios.update({
        where: { id },
        data: {
          estado: 'Inactivo',
          ...(comentario !== undefined && { comentarios: comentario }),
        },
      }),
    ]);

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'UPDATE',
      tabla_afectada: 'usuarios',
      valor_anterior: { id, rol: 'Probacionista', estado: user.estado },
      valor_nuevo: { id, rol: 'ExProbacionista', estado: 'Inactivo', comentarios: comentario ?? null },
    });

    return this.findOne(id);
  }

  async getInstructorStats(instructorId: string) {
    const clases = await this.prisma.clases.findMany({
      where: { instructor_id: instructorId },
      include: {
        materia: { select: { nombre: true, nivel: true } },
        inscripciones: {
          where: { estado: 'Activo' },
          include: { asistencias: { select: { estado: true } } },
        },
        sesiones: {
          include: { asistencias: { select: { estado: true } } },
          orderBy: { fecha: 'asc' },
        },
      },
      orderBy: [{ estado: 'asc' }, { materia: { nombre: 'asc' } }],
    });

    return clases.map((clase) => {
      const totalAlumnos = clase.inscripciones.length;
      const totalSesiones = clase.sesiones.length;
      const totalPosibles = totalSesiones * totalAlumnos;

      const pctPorAlumno = clase.inscripciones.map((insc) => {
        const presentes = insc.asistencias.filter((a) => a.estado === 'Presente').length;
        return totalSesiones > 0 ? Math.round((presentes / totalSesiones) * 100) : 0;
      });
      const promedio =
        pctPorAlumno.length > 0
          ? Math.round(pctPorAlumno.reduce((s, p) => s + p, 0) / pctPorAlumno.length)
          : 0;
      const totalPresencias = clase.inscripciones.reduce(
        (sum, insc) => sum + insc.asistencias.filter((a) => a.estado === 'Presente').length,
        0,
      );

      const sesiones_historico = clase.sesiones.map((s) => {
        const presentes = s.asistencias.filter((a) => a.estado === 'Presente').length;
        return {
          fecha: s.fecha,
          presentes,
          total: totalAlumnos,
          porcentaje: totalAlumnos > 0 ? Math.round((presentes / totalAlumnos) * 100) : 0,
        };
      });

      return {
        id: clase.id,
        codigo: clase.codigo,
        estado: clase.estado,
        materia: clase.materia,
        total_sesiones: totalSesiones,
        total_alumnos: totalAlumnos,
        promedio_asistencia: promedio,
        total_presencias: totalPresencias,
        total_posibles: totalPosibles,
        sesiones_historico,
      };
    });
  }

  async getMyAsistencias(userId: string, claseId?: string) {
    const where: any = { usuario_id: userId };
    if (claseId) where.clase_id = claseId;

    const inscripciones = await this.prisma.inscripciones.findMany({
      where,
      include: {
        clase: { include: { materia: { select: { id: true, nombre: true } } } },
        asistencias: {
          select: { estado: true, sesion: { select: { fecha: true } } },
          orderBy: { sesion: { fecha: 'desc' } },
        },
      },
    });

    return inscripciones.map((insc) => {
      const total = insc.asistencias.length;
      const presentes = insc.asistencias.filter((a) => a.estado === 'Presente').length;
      const ausentes = insc.asistencias.filter((a) => a.estado === 'Ausente').length;
      const licencias = insc.asistencias.filter((a) => a.estado === 'Licencia').length;
      const ultimas_sesiones = insc.asistencias.slice(0, 10).reverse().map((a) => ({
        fecha: a.sesion.fecha,
        estado: a.estado,
      }));
      return {
        inscripcion_id: insc.id,
        clase: { id: insc.clase.id, materia: insc.clase.materia },
        total_sesiones: total,
        presentes,
        ausentes,
        licencias,
        porcentaje: total > 0 ? Math.round((presentes / total) * 100) : 0,
        ultimas_sesiones,
      };
    });
  }

  async importCsv(actorId: string, buffer: Buffer, rolNombre: string): Promise<ImportResultDto> {
    const rol = await this.prisma.roles.findUnique({ where: { nombre: rolNombre } });
    if (!rol) throw new BadRequestException(`Rol "${rolNombre}" no existe en el sistema`);

    let rows: Record<string, string>[];
    try {
      rows = parse(buffer, { columns: true, skip_empty_lines: true, trim: true });
    } catch {
      throw new BadRequestException('El archivo CSV no pudo ser procesado. Verificá el formato.');
    }

    if (rows.length === 0) throw new BadRequestException('El archivo CSV no contiene datos para importar');

    const firstRow = rows[0];
    if (!('nombre_completo' in firstRow) || !('email' in firstRow)) {
      throw new BadRequestException('El archivo CSV debe contener las columnas: nombre_completo, email');
    }

    const resultado: ImportResultDto = { total: rows.length, creados: 0, duplicados: 0, errores: 0, filas_fallidas: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const fila_numero = i + 1;
      const nombre = (row['nombre_completo'] ?? '').trim();
      const email = (row['email'] ?? '').trim();

      const falla = (r: 'duplicado' | 'error', motivo: string) => {
        resultado.filas_fallidas.push({ fila_numero, nombre, email, resultado: r, motivo });
      };

      if (!nombre) { resultado.errores++; falla('error', 'nombre_completo es requerido'); continue; }
      if (!email)  { resultado.errores++; falla('error', 'email es requerido'); continue; }

      const existing = await this.prisma.usuarios.findUnique({ where: { email } });
      if (existing) { resultado.duplicados++; falla('duplicado', 'El email ya existe en el sistema'); continue; }

      const estadoRaw = row['estado']?.trim();
      const estadoValido = ['Activo', 'Inactivo'].includes(estadoRaw) ? estadoRaw as any : 'Activo';

      try {
        const user = await this.prisma.usuarios.create({
          data: {
            nombre_completo: nombre,
            email,
            telefono:         row['telefono']?.trim() || null,
            ci:               row['ci']?.trim() || null,
            genero:           row['genero']?.trim() || null,
            fecha_nacimiento: row['fecha_nacimiento']?.trim() ? new Date(row['fecha_nacimiento'].trim()) : null,
            fecha_inscripcion: row['fecha_inscripcion']?.trim() ? new Date(row['fecha_inscripcion'].trim()) : null,
            estado:           estadoValido,
            must_change_password: false,
          },
        });
        await this.prisma.usuario_roles.create({ data: { usuario_id: user.id, rol_id: rol.id } });
        this.auditoria.log({ usuario_id: actorId, accion: 'INSERT', tabla_afectada: 'usuarios', valor_nuevo: { id: user.id, email, nombre_completo: nombre, rol: rolNombre } });
        resultado.creados++;
      } catch {
        resultado.errores++;
        falla('error', 'Error al crear el usuario');
      }
    }

    return resultado;
  }

  getImportTemplate(): string {
    return [
      'nombre_completo,email,telefono,ci,fecha_nacimiento,genero,estado,fecha_inscripcion',
      'Juan Perez,juan.perez@ejemplo.com,1134567890,12345678,1990-05-15,Masculino,Activo,2024-03-01',
      'Maria Garcia,maria.garcia@ejemplo.com,,,1985-11-30,Femenino,,',
    ].join('\n');
  }

  async exportExcel(filters: { rol?: string; estado?: string; search?: string }, res: Response): Promise<void> {
    const users = await this.findAll(filters as any);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Usuarios');

    sheet.columns = [
      { header: 'Nombre completo',    key: 'nombre_completo',    width: 30 },
      { header: 'Email',              key: 'email',              width: 30 },
      { header: 'CI',                 key: 'ci',                 width: 15 },
      { header: 'Teléfono',           key: 'telefono',           width: 15 },
      { header: 'Género',             key: 'genero',             width: 12 },
      { header: 'Fecha nacimiento',   key: 'fecha_nacimiento',   width: 18 },
      { header: 'Estado',             key: 'estado',             width: 10 },
      { header: 'Fecha inscripción',  key: 'fecha_inscripcion',  width: 18 },
      { header: 'Fecha recibimiento', key: 'fecha_recibimiento', width: 18 },
      { header: 'Roles',              key: 'roles',              width: 25 },
      { header: 'Creado el',          key: 'created_at',         width: 18 },
    ];

    for (const u of users) {
      sheet.addRow({
        nombre_completo:    u.nombre_completo,
        email:              u.email ?? '',
        ci:                 u.ci ?? '',
        telefono:           u.telefono ?? '',
        genero:             u.genero ?? '',
        fecha_nacimiento:   u.fecha_nacimiento ? new Date(u.fecha_nacimiento).toLocaleDateString('es-AR') : '',
        estado:             u.estado,
        fecha_inscripcion:  u.fecha_inscripcion ? new Date(u.fecha_inscripcion).toLocaleDateString('es-AR') : '',
        fecha_recibimiento: u.fecha_recibimiento ? new Date(u.fecha_recibimiento).toLocaleDateString('es-AR') : '',
        roles:              (u as any).roles?.map((r: any) => r.rol.nombre).join(', ') ?? '',
        created_at:         new Date(u.created_at).toLocaleDateString('es-AR'),
      });
    }

    const fecha = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="usuarios-${fecha}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  }
}
