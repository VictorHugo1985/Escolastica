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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MateriasService } from './materias.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Rol } from '@escolastica/shared';

@ApiTags('materias')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('materias')
export class MateriasController {
  constructor(private readonly materiasService: MateriasService) {}

  @Get()
  @ApiOperation({ summary: 'Lista de materias con filtros' })
  @ApiQuery({ name: 'nombre', required: false })
  @ApiQuery({ name: 'estado', required: false })
  @ApiQuery({ name: 'nivel', required: false, type: Number })
  @ApiQuery({ name: 'es_curso_probacion', required: false, type: Boolean })
  findAll(
    @Query('nombre') nombre?: string,
    @Query('estado') estado?: string,
    @Query('nivel') nivel?: string,
    @Query('es_curso_probacion') esCursoProbacion?: string,
  ) {
    return this.materiasService.findAll({
      nombre,
      estado,
      nivel: nivel ? parseInt(nivel) : undefined,
      es_curso_probacion: esCursoProbacion !== undefined ? esCursoProbacion === 'true' : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de materia con temas' })
  findOne(@Param('id') id: string) {
    return this.materiasService.findOne(id);
  }

  @Get(':id/temas')
  @ApiOperation({ summary: 'Temas activos de una materia (pensum)' })
  findTemas(@Param('id') id: string) {
    return this.materiasService.findTemas(id);
  }

  @Post()
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Crear materia (solo Escolastico)' })
  create(@Request() req, @Body() body: any) {
    return this.materiasService.create(req.user.id, body);
  }

  @Patch(':id')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Actualizar materia (solo Escolastico)' })
  update(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.materiasService.update(req.user.id, id, body);
  }

  @Patch(':id/deactivate')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Desactivar materia (solo Escolastico)' })
  deactivate(@Request() req, @Param('id') id: string) {
    return this.materiasService.deactivate(req.user.id, id);
  }

  @Post(':id/temas')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Crear tema en una materia' })
  createTema(@Request() req, @Param('id') materiaId: string, @Body() body: any) {
    return this.materiasService.createTema(req.user.id, materiaId, body);
  }

  @Patch(':id/temas/:temaId')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Actualizar tema de una materia' })
  updateTema(
    @Request() req,
    @Param('id') materiaId: string,
    @Param('temaId') temaId: string,
    @Body() body: any,
  ) {
    return this.materiasService.updateTema(req.user.id, materiaId, temaId, body);
  }

  @Patch(':id/temas/reorder')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Reordenar temas de una materia' })
  reorderTemas(
    @Request() req,
    @Param('id') materiaId: string,
    @Body() body: { temas: { id: string; orden: number }[] },
  ) {
    return this.materiasService.reorderTemas(req.user.id, materiaId, body.temas);
  }

  @Delete(':id/temas/:temaId')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Eliminar tema (soft-delete)' })
  deleteTema(
    @Request() req,
    @Param('id') materiaId: string,
    @Param('temaId') temaId: string,
  ) {
    return this.materiasService.deleteTema(req.user.id, materiaId, temaId);
  }
}
