export type AccionAuditoria = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AuditoriaPayload {
  usuario_id: string | null;
  accion: AccionAuditoria;
  tabla_afectada: string;
  valor_anterior?: Record<string, unknown>;
  valor_nuevo?: Record<string, unknown>;
}
