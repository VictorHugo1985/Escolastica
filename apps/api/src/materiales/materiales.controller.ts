import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MaterialesService } from './materiales.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Rol } from '@escolastica/shared';

@ApiTags('materiales')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('clases/:id/material')
export class MaterialesController {
  constructor(private readonly materialesService: MaterialesService) {}

  @Get()
  @Roles(Rol.Instructor, Rol.Escolastico)
  @ApiOperation({ summary: 'Control de material: lista fija de inscritos con total y detalle de pagos' })
  findControl(@Request() req, @Param('id') id: string) {
    return this.materialesService.findControl(req.user, id);
  }

  @Patch()
  @Roles(Rol.Instructor, Rol.Escolastico)
  @ApiOperation({ summary: 'Actualizar el comentario general de la cabecera de material' })
  updateCabecera(@Request() req, @Param('id') id: string, @Body() body: unknown) {
    return this.materialesService.updateCabecera(req.user, id, body);
  }

  @Post('pagos')
  @Roles(Rol.Instructor, Rol.Escolastico)
  @ApiOperation({ summary: 'Registrar un pago de material (crea la cabecera con el primer pago)' })
  createPago(@Request() req, @Param('id') id: string, @Body() body: unknown) {
    return this.materialesService.createPago(req.user, id, body);
  }

  @Patch('pagos/:pagoId')
  @Roles(Rol.Instructor, Rol.Escolastico)
  @ApiOperation({ summary: 'Editar un pago de material' })
  updatePago(@Request() req, @Param('id') id: string, @Param('pagoId') pagoId: string, @Body() body: unknown) {
    return this.materialesService.updatePago(req.user, id, pagoId, body);
  }

  @Delete('pagos/:pagoId')
  @Roles(Rol.Instructor, Rol.Escolastico)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un pago de material' })
  deletePago(@Request() req, @Param('id') id: string, @Param('pagoId') pagoId: string) {
    return this.materialesService.deletePago(req.user, id, pagoId);
  }
}
