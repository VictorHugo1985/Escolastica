import { prisma } from './prisma';

interface AuditPayload {
  usuario_id: string | null;
  accion: string;
  tabla_afectada: string;
  valor_anterior?: Record<string, unknown> | null;
  valor_nuevo?: Record<string, unknown> | null;
}

export async function auditLog(payload: AuditPayload) {
  try {
    await prisma.logs_auditoria.create({
      data: {
        usuario_id: payload.usuario_id,
        accion: payload.accion,
        tabla_afectada: payload.tabla_afectada,
        valor_anterior: (payload.valor_anterior ?? undefined) as any,
        valor_nuevo: (payload.valor_nuevo ?? undefined) as any,
      },
    });
  } catch (e) {
    console.error('Audit log error:', e);
  }
}
