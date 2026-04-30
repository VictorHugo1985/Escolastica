import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditoriaService } from './auditoria.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Rol } from '@escolastica/shared';

@ApiTags('audit-logs')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(Rol.Escolastico)
@Controller('audit-logs')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  @ApiOperation({ summary: 'Lista logs de auditoría con filtros (solo Escolástico)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de logs' })
  @ApiQuery({ name: 'tabla_afectada', required: false })
  @ApiQuery({ name: 'usuario_id', required: false })
  @ApiQuery({ name: 'accion', required: false })
  @ApiQuery({ name: 'fechaDesde', required: false })
  @ApiQuery({ name: 'fechaHasta', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('tabla_afectada') tabla_afectada?: string,
    @Query('usuario_id') usuario_id?: string,
    @Query('accion') accion?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.auditoriaService.findAll({
      tabla_afectada,
      usuario_id,
      accion,
      fechaDesde,
      fechaHasta,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get(':entidad/:entidadId')
  @ApiOperation({ summary: 'Logs de auditoría para un registro específico' })
  @ApiResponse({ status: 200, description: 'Historial de cambios del registro' })
  findByEntity(
    @Param('entidad') entidad: string,
    @Param('entidadId') entidadId: string,
  ) {
    return this.auditoriaService.findByEntity(entidad, entidadId);
  }
}
