import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateAulaDto, UpdateAulaDto } from '@escolastica/shared';

@Injectable()
export class AulasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  findAll() {
    return this.prisma.aulas.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const aula = await this.prisma.aulas.findUnique({
      where: { id },
      include: {
        _count: { select: { horarios: true } },
      },
    });
    if (!aula) throw new NotFoundException(`Aula ${id} no encontrada`);
    return aula;
  }

  async create(actorId: string, data: CreateAulaDto) {
    const existing = await this.prisma.aulas.findFirst({
      where: { nombre: { equals: data.nombre, mode: 'insensitive' } },
    });
    if (existing) throw new ConflictException('Ya existe un aula con ese nombre');

    const aula = await this.prisma.aulas.create({ data });

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'INSERT',
      tabla_afectada: 'aulas',
      valor_nuevo: { id: aula.id, nombre: aula.nombre },
    });

    return aula;
  }

  async update(actorId: string, id: string, data: UpdateAulaDto) {
    const before = await this.findOne(id);

    if (data.nombre && data.nombre !== before.nombre) {
      const dup = await this.prisma.aulas.findFirst({
        where: { nombre: { equals: data.nombre, mode: 'insensitive' }, NOT: { id } },
      });
      if (dup) throw new ConflictException('Ya existe un aula con ese nombre');
    }

    const updated = await this.prisma.aulas.update({ where: { id }, data });

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'UPDATE',
      tabla_afectada: 'aulas',
      valor_anterior: { id, nombre: before.nombre, capacidad: before.capacidad },
      valor_nuevo: { id, nombre: updated.nombre, capacidad: updated.capacidad },
    });

    return updated;
  }

  async remove(actorId: string, id: string) {
    const aula = await this.findOne(id);

    const horarioCount = await this.prisma.horarios.count({ where: { aula_id: id } });
    if (horarioCount > 0) {
      throw new ConflictException(
        `No se puede eliminar: el aula tiene ${horarioCount} horario(s) activo(s) vinculado(s)`,
      );
    }

    await this.prisma.aulas.delete({ where: { id } });

    await this.auditoria.log({
      usuario_id: actorId,
      accion: 'DELETE',
      tabla_afectada: 'aulas',
      valor_anterior: { id, nombre: aula.nombre },
    });
  }
}
