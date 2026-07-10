import { Controller, Get, Put, Query, Request, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificacionesService } from './notificaciones.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Rol } from '@escolastica/shared';

@ApiTags('notificaciones')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(Rol.Escolastico, Rol.Instructor)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get()
  @ApiOperation({ summary: 'Últimas 20 notificaciones y contador de no leídas' })
  @ApiResponse({ status: 200, description: 'Notificaciones recientes del sistema' })
  getRecientes(@Request() req: { user: { id: string } }) {
    return this.notificacionesService.getRecientes(req.user.id);
  }

  @Get('clases-inactivas')
  @ApiOperation({ summary: 'Clases activas con 15+ días sin sesiones registradas' })
  @ApiResponse({ status: 200, description: 'Lista vigente de clases inactivas (evalúa y registra la alerta del día)' })
  async getClasesInactivas() {
    const clases = await this.notificacionesService.evaluarClasesInactivas();
    return { clases };
  }

  @Get('historial')
  @ApiOperation({ summary: 'Historial completo de notificaciones con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Historial paginado de notificaciones' })
  @ApiQuery({ name: 'tipo', required: false, enum: ['pase_de_lista', 'baja_inscrito', 'promocion_miembro', 'clase_inactiva'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistorial(
    @Query('tipo') tipo?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const limitNum = Math.min(Number(limit) || 20, 100);
    return this.notificacionesService.getHistorial({
      tipo,
      page: Number(page) || 1,
      limit: limitNum,
    });
  }

  @Put('marcar-leidas')
  @HttpCode(204)
  @ApiOperation({ summary: 'Marca todas las notificaciones como leídas para el usuario actual' })
  @ApiResponse({ status: 204, description: 'Estado de lectura actualizado' })
  marcarLeidas(@Request() req: { user: { id: string } }) {
    return this.notificacionesService.marcarLeidas(req.user.id);
  }
}
