import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import type { CreateMateriaDto, UpdateMateriaDto } from '@escolastica/shared';

@Injectable()
export class MateriasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  findAll(filters: { nombre?: string; estado?: string; es_curso_probacion?: boolean; nivel?: number } = {}) {
    return this.prisma.materias.findMany({
      where: {
        ...(filters.nombre && { nombre: { contains: filters.nombre, mode: 'insensitive' } }),
        ...(filters.estado && { estado: filters.estado as any }),
        ...(filters.es_curso_probacion !== undefined && { es_curso_probacion: filters.es_curso_probacion }),
        ...(filters.nivel !== undefined && { nivel: filters.nivel }),
      },
      include: { _count: { select: { temas: true, clases: true } } },
      orderBy: [{ nivel: 'asc' }, { nombre: 'asc' }],
    });
  }

  async findOne(id: string) {
    const materia = await this.prisma.materias.findUnique({
      where: { id },
      include: { temas: { where: { estado: 'Activo' }, orderBy: { orden: 'asc' } } },
    });
    if (!materia) throw new NotFoundException(`Materia ${id} no encontrada`);
    return materia;
  }

  async create(actorId: string, data: CreateMateriaDto) {
    const existing = await this.prisma.materias.findFirst({
      where: { nombre: { equals: data.nombre, mode: 'insensitive' } },
    });
    if (existing) throw new ConflictException(`Ya existe una materia con el nombre '${data.nombre}'`);

    const materia = await this.prisma.materias.create({ data });

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'INSERT',
      tabla_afectada: 'materias',
      valor_nuevo: { id: materia.id, nombre: materia.nombre, nivel: materia.nivel },
    });

    return materia;
  }

  async update(actorId: string, id: string, data: UpdateMateriaDto) {
    const before = await this.findOne(id);

    if (data.nombre && data.nombre !== before.nombre) {
      const dup = await this.prisma.materias.findFirst({
        where: { nombre: { equals: data.nombre, mode: 'insensitive' }, NOT: { id } },
      });
      if (dup) throw new ConflictException(`Ya existe una materia con el nombre '${data.nombre}'`);
    }

    const updated = await this.prisma.materias.update({ where: { id }, data });

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'UPDATE',
      tabla_afectada: 'materias',
      valor_anterior: { id, nombre: before.nombre, nivel: before.nivel },
      valor_nuevo: { id, nombre: updated.nombre, nivel: updated.nivel },
    });

    return updated;
  }

  async deactivate(actorId: string, id: string) {
    const before = await this.findOne(id);

    const updated = await this.prisma.materias.update({
      where: { id },
      data: { estado: 'Inactivo' },
    });

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'UPDATE',
      tabla_afectada: 'materias',
      valor_anterior: { id, estado: before.estado },
      valor_nuevo: { id, estado: 'Inactivo' },
    });

    return updated;
  }

  findTemas(materiaId: string) {
    return this.prisma.temas.findMany({
      where: { materia_id: materiaId, estado: 'Activo' },
      orderBy: { orden: 'asc' },
    });
  }

  async createTema(actorId: string, materiaId: string, data: { titulo: string; descripcion?: string; orden?: number }) {
    await this.findOne(materiaId);
    
    const count = await this.prisma.temas.count({ 
      where: { materia_id: materiaId, estado: 'Activo' } 
    });
    
    const tema = await this.prisma.temas.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        orden: data.orden ?? (count + 1),
        materia_id: materiaId,
        estado: 'Activo',
      },
    });

    try {
      await this.auditoria.log({
        usuario_id: actorId,
        accion: 'INSERT',
        tabla_afectada: 'temas',
        valor_nuevo: { id: tema.id, titulo: tema.titulo, materia_id: materiaId },
      });
    } catch (e) {
      console.error('Error logging audit for createTema:', e);
      // No fallamos la operación principal por un error de log
    }

    return tema;
  }

  async updateTema(actorId: string, materiaId: string, id: string, data: any) {
    const before = await this.prisma.temas.findFirst({ where: { id, materia_id: materiaId } });
    if (!before) throw new NotFoundException('Tema no encontrado');

    const updated = await this.prisma.temas.update({ where: { id }, data });

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'UPDATE',
      tabla_afectada: 'temas',
      valor_anterior: { id, titulo: before.titulo },
      valor_nuevo: { id, titulo: updated.titulo },
    });

    return updated;
  }

  async reorderTemas(actorId: string, materiaId: string, items: { id: string; orden: number }[]) {
    await this.findOne(materiaId);

    await this.prisma.$transaction(
      items.map(({ id, orden }) => this.prisma.temas.update({ where: { id }, data: { orden } })),
    );

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'UPDATE',
      tabla_afectada: 'temas',
      valor_nuevo: { materia_id: materiaId, reorder: items },
    });

    return this.findTemas(materiaId);
  }

  async deleteTema(actorId: string, materiaId: string, id: string) {
    const before = await this.prisma.temas.findFirst({ where: { id, materia_id: materiaId } });
    if (!before) throw new NotFoundException('Tema no encontrado');

    await this.prisma.temas.update({
      where: { id },
      data: { estado: 'Inactivo' },
    });

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'DELETE',
      tabla_afectada: 'temas',
      valor_anterior: { id, titulo: before.titulo },
    });
  }
}
