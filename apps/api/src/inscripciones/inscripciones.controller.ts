import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InscripcionesService } from './inscripciones.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Rol } from '@escolastica/shared';

@ApiTags('inscripciones')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('inscripciones')
export class InscripcionesController {
  constructor(private readonly inscripcionesService: InscripcionesService) {}

  @Get()
  @ApiOperation({ summary: 'Historial de inscripciones de un usuario (todos los estados)' })
  @ApiQuery({ name: 'usuarioId', required: false })
  getHistorial(@Query('usuarioId') usuarioId?: string) {
    if (usuarioId) return this.inscripcionesService.getHistorialByUsuario(usuarioId);
    return [];
  }

  @Patch(':id/baja')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Dar de baja una inscripción (solo Escolastico)' })
  registrarBaja(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.inscripcionesService.registrarBaja(req.user.id, id, body);
  }

  @Patch(':id/conclusion')
  @ApiOperation({ summary: 'Marcar conclusión de temario (Instructor titular o Escolastico)' })
  marcarConclusion(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.inscripcionesService.marcarConclusion(
      req.user.id,
      req.user.roles ?? [],
      id,
      body,
    );
  }
}
