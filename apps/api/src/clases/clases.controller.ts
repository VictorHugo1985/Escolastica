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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClasesService } from './clases.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Rol } from '@escolastica/shared';

@ApiTags('clases')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('clases')
export class ClasesController {
  constructor(private readonly clasesService: ClasesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista de clases con filtros' })
  @ApiQuery({ name: 'materia_id', required: false })
  @ApiQuery({ name: 'instructor_id', required: false })
  @ApiQuery({ name: 'estado', required: false })
  @ApiQuery({ name: 'anio_inicio', required: false, type: Number })
  @ApiQuery({ name: 'mes_inicio', required: false, type: Number })
  findAll(
    @Query('materia_id') materiaId?: string,
    @Query('instructor_id') instructorId?: string,
    @Query('estado') estado?: string,
    @Query('anio_inicio') anioInicio?: string,
    @Query('mes_inicio') mesInicio?: string,
  ) {
    return this.clasesService.findAll({
      materia_id: materiaId,
      instructor_id: instructorId,
      estado,
      anio_inicio: anioInicio ? parseInt(anioInicio) : undefined,
      mes_inicio: mesInicio ? parseInt(mesInicio) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle completo de clase (materia, instructor, horarios, inscripciones)' })
  findOne(@Param('id') id: string) {
    return this.clasesService.findOne(id);
  }

  @Post()
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Crear clase con instructor y código auto-generado (solo Escolastico)' })
  create(@Request() req, @Body() body: any) {
    return this.clasesService.create(req.user.id, body);
  }

  @Patch(':id')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Actualizar clase — celador o fecha_fin (solo Escolastico)' })
  update(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.clasesService.update(req.user.id, id, body);
  }

  @Patch(':id/status')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Cambiar estado de clase: Activa | Inactiva | Finalizada (solo Escolastico)' })
  changeStatus(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.clasesService.changeStatus(req.user.id, id, body);
  }

  // --- Horarios ---

  @Get(':id/horarios')
  @ApiOperation({ summary: 'Horarios de una clase' })
  findHorarios(@Param('id') id: string) {
    return this.clasesService.findHorarios(id);
  }

  @Post(':id/horarios')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Agregar bloque horario (solo Escolastico)' })
  createHorario(@Param('id') id: string, @Body() body: any) {
    return this.clasesService.createHorario(id, body);
  }

  @Delete(':id/horarios/:horarioId')
  @Roles(Rol.Escolastico)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar bloque horario (solo Escolastico)' })
  deleteHorario(@Param('id') id: string, @Param('horarioId') horarioId: string) {
    return this.clasesService.deleteHorario(id, horarioId);
  }

  // --- Inscripciones ---

  @Get(':id/inscripciones')
  @ApiOperation({ summary: 'Alumnos inscritos activos en la clase' })
  findInscripciones(@Param('id') id: string) {
    return this.clasesService.findInscripciones(id);
  }

  @Get(':id/inscripciones/historial')
  @ApiOperation({ summary: 'Historial completo de inscripciones (activos + bajas) de la clase' })
  findInscripcionesHistorial(@Param('id') id: string) {
    return this.clasesService.findInscripcionesHistorial(id);
  }

  @Post(':id/inscripciones')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Inscribir alumno en clase (solo Escolastico)' })
  createInscripcion(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.clasesService.createInscripcion(req.user.id, id, body);
  }

  @Patch(':id/inscripciones/:inscripcionId/baja')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Dar de baja a un alumno de la clase (solo Escolastico)' })
  bajaInscripcion(
    @Request() req,
    @Param('id') id: string,
    @Param('inscripcionId') inscripcionId: string,
    @Body() body: any,
  ) {
    return this.clasesService.bajaInscripcion(req.user.id, id, inscripcionId, body);
  }
}
