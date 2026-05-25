import { z } from 'zod';

export const TipoNotificacion = z.enum(['pase_de_lista', 'baja_inscrito', 'promocion_miembro']);
export type TipoNotificacion = z.infer<typeof TipoNotificacion>;

// Internal payloads used by NotificacionesService.registrar()
export interface PaseDeListaPayload {
  tipo: 'pase_de_lista';
  actor_id: string;
  clase_id: string;
  nombre_clase: string;
  nombre_actor: string;
  total_presentes: number;
}

export interface BajaInscritoPayload {
  tipo: 'baja_inscrito';
  actor_id: string;
  clase_id: string;
  usuario_afectado_id: string;
  nombre_clase: string;
  nombre_actor: string;
  nombre_afectado: string;
}

export interface PromocionMiembroPayload {
  tipo: 'promocion_miembro';
  actor_id: string;
  usuario_afectado_id: string;
  nombre_actor: string;
  nombre_afectado: string;
}

export type NotificacionPayload =
  | PaseDeListaPayload
  | BajaInscritoPayload
  | PromocionMiembroPayload;

// Response shape for GET /notificaciones and GET /notificaciones/historial
export interface NotificacionDto {
  id: string;
  tipo: TipoNotificacion;
  descripcion: string;
  actor: { id: string; nombre_completo: string } | null;
  clase: { id: string; codigo: string; materia: string } | null;
  usuario_afectado: { id: string; nombre_completo: string } | null;
  created_at: string;
}

export interface GetNotificacionesResponseDto {
  notificaciones: NotificacionDto[];
  total_no_leidas: number;
}

export interface GetHistorialResponseDto {
  notificaciones: NotificacionDto[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
