import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AulasService } from './aulas.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Rol } from '@escolastica/shared';

@ApiTags('aulas')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('aulas')
export class AulasController {
  constructor(private readonly aulasService: AulasService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas las aulas' })
  findAll() {
    return this.aulasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de aula con conteo de horarios vinculados' })
  findOne(@Param('id') id: string) {
    return this.aulasService.findOne(id);
  }

  @Post()
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Crea una nueva aula' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 409, description: 'Nombre duplicado' })
  create(@Request() req, @Body() body: any) {
    return this.aulasService.create(req.user.id, body);
  }

  @Patch(':id')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Actualiza datos de un aula' })
  update(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.aulasService.update(req.user.id, id, body);
  }

  @Delete(':id')
  @Roles(Rol.Escolastico)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un aula (bloquea si tiene horarios activos)' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 409, description: 'Aula con horarios vinculados' })
  remove(@Request() req, @Param('id') id: string) {
    return this.aulasService.remove(req.user.id, id);
  }
}
