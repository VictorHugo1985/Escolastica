import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { requireAuth, requireRole, json, handleError, ApiError } from '@/lib/route';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);
    return json(await prisma.inscripciones.findMany({
      where: { clase_id: params.id, estado: 'Activo' },
      include: { usuario: { select: { id: true, nombre_completo: true, email: true, roles: { include: { rol: true } } } } },
      orderBy: { fecha_inscripcion: 'asc' },
    }));
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAuth(req);
    requireRole(actor, 'Escolastico');
    const dto = await req.json();

    const clase = await prisma.clases.findUnique({
      where: { id: params.id },
      include: { materia: true },
    });
    if (!clase) throw new ApiError('Clase no encontrada', 404);
    if (clase.estado === 'Finalizada') throw new ApiError('No se puede inscribir en una clase Finalizada', 409);
    if (clase.instructor_id === dto.usuario_id) throw new ApiError('El instructor titular no puede inscribirse como alumno', 409);

    const dup = await prisma.inscripciones.findUnique({
      where: { usuario_id_clase_id: { usuario_id: dto.usuario_id, clase_id: params.id } },
    });
    if (dup && dup.estado === 'Activo') throw new ApiError('El usuario ya está inscrito en esta clase', 409);

    const user = await prisma.usuarios.findUnique({
      where: { id: dto.usuario_id },
      include: { roles: { include: { rol: true } } },
    });
    if (!user) throw new ApiError('Usuario no encontrado', 404);

    const userRoles = user.roles.map((r) => r.rol.nombre);
    if (userRoles.includes('Probacionista') && !clase.materia.es_curso_probacion)
      throw new ApiError('Los Probacionistas solo pueden inscribirse en materias de probación', 409);
    if (clase.materia.es_curso_probacion && !userRoles.includes('Probacionista'))
      throw new ApiError('Esta materia es de probación: solo pueden inscribirse Probacionistas', 409);

    const inscripcion = dup
      ? await prisma.inscripciones.update({ where: { id: dup.id }, data: { estado: 'Activo', fecha_baja: null, motivo_baja: null } })
      : await prisma.inscripciones.create({ data: { usuario_id: dto.usuario_id, clase_id: params.id } });

    await auditLog({ usuario_id: actor.sub, accion: 'INSERT', tabla_afectada: 'inscripciones', valor_nuevo: { inscripcion_id: inscripcion.id, usuario_id: dto.usuario_id, clase_id: params.id } });
    return json(inscripcion, 201);
  } catch (e) { return handleError(e); }
}
