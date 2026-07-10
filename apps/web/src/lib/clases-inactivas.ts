import { prisma } from '@/lib/prisma';

const DIAS_INACTIVIDAD = 15;

// Detecta clases activas con 15+ días sin sesiones y mantiene una única
// notificación agregada por día, actualizada solo cuando cambia la lista
export async function evaluarClasesInactivas(): Promise<void> {
  try {
    const [clasesActivas, ultimasSesiones] = await Promise.all([
      prisma.clases.findMany({
        where: { estado: 'Activa' },
        select: {
          id: true,
          codigo: true,
          fecha_inicio: true,
          materia: { select: { nombre: true } },
        },
      }),
      prisma.sesiones.groupBy({ by: ['clase_id'], _max: { fecha: true } }),
    ]);

    const ultimaSesionPorClase = new Map(ultimasSesiones.map((s) => [s.clase_id, s._max.fecha]));
    const now = new Date();
    const hoyUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    const clasesInactivas = clasesActivas
      .map((clase) => {
        const referencia = ultimaSesionPorClase.get(clase.id) ?? clase.fecha_inicio;
        return {
          nombre_clase: `${clase.materia.nombre} (${clase.codigo})`,
          dias_inactiva: Math.floor((hoyUtc - referencia.getTime()) / 86_400_000),
        };
      })
      .filter((c) => c.dias_inactiva >= DIAS_INACTIVIDAD)
      .sort((a, b) => b.dias_inactiva - a.dias_inactiva);

    if (clasesInactivas.length === 0) return;

    const n = clasesInactivas.length;
    const lista = clasesInactivas.map((c) => `${c.nombre_clase} — ${c.dias_inactiva} días`).join('; ');
    const descripcion = `${n} clase${n !== 1 ? 's' : ''} sin sesiones recientes: ${lista}`;

    const existente = await prisma.notificaciones_actividad.findFirst({
      where: { tipo: 'clase_inactiva', created_at: { gte: new Date(hoyUtc) } },
    });

    if (!existente) {
      await prisma.notificaciones_actividad.create({
        data: { tipo: 'clase_inactiva', descripcion },
      });
    } else if (existente.descripcion !== descripcion) {
      await prisma.notificaciones_actividad.update({
        where: { id: existente.id },
        data: { descripcion, created_at: new Date() },
      });
    }
  } catch {
    // Silently ignore — no afecta la respuesta al cliente
  }
}
