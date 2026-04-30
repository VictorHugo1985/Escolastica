import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SesionesService } from './sesiones.service';
import { AsistenciasService } from './asistencias.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Rol } from '@escolastica/shared';
import { BulkAsistenciaDto, UpdateAsistenciaDto, UpdateSesionDto } from '@escolastica/shared';

@ApiTags('sesiones')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller()
export class SesionesController {
  constructor(
    private readonly sesionesService: SesionesService,
    private readonly asistenciasService: AsistenciasService,
  ) {}

  @Get('clases/hoy')
  @Roles(Rol.Instructor, Rol.Escolastico)
  @ApiOperation({ summary: 'Clases del día: propias para Instructor, todas las activas para Escolástico' })
  findClasesHoy(@Request() req, @Query('fecha') fecha?: string) {
    return this.sesionesService.findClasesHoy(req.user.id, req.user.roles, fecha);
  }

  @Post('clases/:id/sesiones')
  @Roles(Rol.Instructor, Rol.Escolastico)
  @ApiOperation({ summary: 'Crear sesión para una clase con fecha opcional' })
  createSesion(@Param('id') id: string, @Body() body: { fecha?: string }) {
    return this.sesionesService.createSesion({ clase_id: id, fecha: body?.fecha });
  }

  @Get('clases/:id/sesiones')
  @Roles(Rol.Instructor, Rol.Escolastico)
  @ApiOperation({ summary: 'Lista de sesiones de una clase con conteo de asistentes' })
  findSesiones(@Param('id') id: string) {
    return this.sesionesService.findByClase(id);
  }

  @Get('clases/:id/sesiones/:sesionId')
  @Roles(Rol.Instructor, Rol.Escolastico)
  @ApiOperation({ summary: 'Obtener datos de una sesión específica' })
  findSesion(@Param('sesionId') sesionId: string) {
    return this.sesionesService.findOne(sesionId);
  }

  @Patch('clases/:id/sesiones/:sesionId')
  @Roles(Rol.Instructor, Rol.Escolastico)
  @ApiOperation({ summary: 'Actualizar metadatos de una sesión (tipo, tema, comentarios)' })
  updateSesion(
    @Param('sesionId') sesionId: string,
    @Body() body: UpdateSesionDto,
  ) {
    return this.sesionesService.updateSesion(sesionId, body);
  }

  @Get('clases/:id/sesiones/:sesionId/asistencias')
  @Roles(Rol.Instructor, Rol.Escolastico)
  @ApiOperation({ summary: 'Lista de alumnos con estado de asistencia para una sesión' })
  findAsistencias(@Param('id') id: string, @Param('sesionId') sesionId: string) {
    return this.asistenciasService.findBySesion(id, sesionId);
  }

  @Post('clases/:id/sesiones/:sesionId/asistencias/bulk')
  @Roles(Rol.Instructor, Rol.Escolastico)
  @ApiOperation({ summary: 'Upsert masivo de asistencias — alumnos no incluidos quedan como Ausente' })
  bulkUpsert(
    @Request() req,
    @Param('id') id: string,
    @Param('sesionId') sesionId: string,
    @Body() body: BulkAsistenciaDto,
  ) {
    return this.asistenciasService.bulkUpsert(req.user.id, sesionId, body);
  }

  @Patch('clases/:id/sesiones/:sesionId/asistencias/:asistenciaId')
  @Roles(Rol.Instructor, Rol.Escolastico)
  @ApiOperation({ summary: 'Actualizar estado de asistencia individual' })
  updateOne(
    @Request() req,
    @Param('asistenciaId') asistenciaId: string,
    @Body() body: UpdateAsistenciaDto,
  ) {
    return this.asistenciasService.updateOne(req.user.id, asistenciaId, body);
  }

  @Delete('clases/:id/sesiones/:sesionId')
  @Roles(Rol.Escolastico)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar sesión y sus asistencias (solo Escolastico)' })
  deleteSesion(@Param('sesionId') sesionId: string) {
    return this.sesionesService.deleteSesion(sesionId);
  }

  @Get('clases/:id/asistencias/resumen')
  @Roles(Rol.Instructor, Rol.Escolastico)
  @ApiOperation({ summary: 'Resumen de asistencias por alumno con porcentajes calculados' })
  getResumen(@Param('id') id: string) {
    return this.asistenciasService.calcularPorcentajePorAlumno(id);
  }
}
