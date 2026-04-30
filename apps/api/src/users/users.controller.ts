import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import type { Response } from 'express';
import { UsersService } from './users.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Rol } from '@escolastica/shared';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Lista usuarios con filtros opcionales' })
  findAll(
    @Query('rol') rol?: Rol,
    @Query('estado') estado?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({ rol, estado, search });
  }

  @Get('pending-approval')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Lista Probacionistas pendientes de promoción' })
  findPendingApproval() {
    return this.usersService.findPendingApproval();
  }

  @Get('eligible-instructors')
  @ApiOperation({ summary: 'Lista instructores activos elegibles como docentes' })
  getEligibleInstructors() {
    return this.usersService.getEligibleInstructors();
  }

  @Get('eligible-students')
  @ApiOperation({ summary: 'Lista alumnos elegibles para una clase' })
  getEligibleStudents(@Query('claseId') claseId: string) {
    return this.usersService.getEligibleStudents(claseId);
  }

  @Post('import')
  @Roles(Rol.Escolastico)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importación masiva de usuarios desde CSV (Escolástico only)' })
  @ApiResponse({ status: 200, description: 'Resultado de la importación con conteos y filas fallidas' })
  async importCsv(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body('rolNombre') rolNombre: string,
  ) {
    if (!file) throw new BadRequestException('Se requiere un archivo CSV');
    if (!['text/csv', 'text/plain'].includes(file.mimetype)) {
      throw new BadRequestException('Solo se aceptan archivos CSV');
    }
    return this.usersService.importCsv(req.user.id, file.buffer, rolNombre);
  }

  @Get('export')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Exportar usuarios a Excel (Escolástico only)' })
  async exportExcel(
    @Query('rol') rol?: string,
    @Query('estado') estado?: string,
    @Query('search') search?: string,
    @Res() res?: Response,
  ) {
    return this.usersService.exportExcel({ rol, estado, search }, res);
  }

  @Get('import-template')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Descargar plantilla CSV de ejemplo (Escolástico only)' })
  getImportTemplate(@Res() res: Response) {
    const csv = this.usersService.getImportTemplate();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="usuarios-plantilla.csv"');
    res.send(csv);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene detalle de un usuario' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('me/asistencias')
  @ApiOperation({ summary: 'Resumen de asistencias del usuario autenticado por clase' })
  getMyAsistencias(@Request() req, @Query('claseId') claseId?: string) {
    return this.usersService.getMyAsistencias(req.user.id, claseId);
  }

  @Get(':id/asistencias')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Kardex de asistencias de un miembro (Escolástico only)' })
  getAsistenciasById(@Param('id') id: string, @Query('claseId') claseId?: string) {
    return this.usersService.getMyAsistencias(id, claseId);
  }

  @Get(':id/instructor-stats')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Estadísticas de asistencia por clase de un instructor (Escolástico only)' })
  getInstructorStats(@Param('id') id: string) {
    return this.usersService.getInstructorStats(id);
  }

  // Static routes BEFORE parameterized :id routes to avoid conflicts
  @Patch('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cambia la contraseña del usuario autenticado' })
  changeOwnPassword(@Request() req, @Body() body: any) {
    return this.usersService.changeOwnPassword(req.user.id, body.currentPassword, body.newPassword);
  }

  @Post()
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Crea un nuevo usuario (Escolástico only)' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  create(@Request() req, @Body() body: any) {
    return this.usersService.create(req.user.id, body);
  }

  @Patch(':id')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Actualiza perfil de usuario (Escolástico only)' })
  update(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.usersService.update(req.user.id, id, body);
  }

  @Post(':id/roles')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Agrega un rol adicional al usuario' })
  @ApiResponse({ status: 200, description: 'Rol agregado; devuelve usuario con roles actualizados' })
  @ApiResponse({ status: 400, description: 'Rol inválido o viola exclusividad' })
  @ApiResponse({ status: 409, description: 'El usuario ya tiene ese rol' })
  addRole(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.usersService.addRole(req.user.id, id, body);
  }

  @Delete(':id/roles/:rolNombre')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Revoca un rol específico del usuario' })
  @ApiResponse({ status: 200, description: 'Rol revocado; devuelve usuario con roles actualizados' })
  @ApiResponse({ status: 400, description: 'Usuario no tiene ese rol, quedaría sin roles, o tiene clases activas' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  removeRole(@Request() req, @Param('id') id: string, @Param('rolNombre') rolNombre: string) {
    return this.usersService.removeRole(req.user.id, id, rolNombre);
  }

  @Patch(':id/deactivate')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Desactiva un usuario (Soft Delete)' })
  deactivate(@Request() req, @Param('id') id: string) {
    return this.usersService.softDelete(req.user.id, id);
  }

  @Post(':id/promote')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Promueve Probacionista a Miembro' })
  promote(@Request() req, @Param('id') id: string) {
    return this.usersService.promote(req.user.id, id);
  }

  @Post(':id/reject')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Rechaza Probacionista → asigna rol ExProbacionista (con comentario opcional)' })
  @ApiResponse({ status: 200, description: 'Usuario marcado como ExProbacionista' })
  @ApiResponse({ status: 400, description: 'Usuario no es Probacionista o rol no existe' })
  reject(@Request() req, @Param('id') id: string, @Body() body: { comentario?: string }) {
    return this.usersService.markAsExProbacionista(req.user.id, id, body.comentario);
  }

  @Patch(':id/interview')
  @Roles(Rol.Escolastico)
  @ApiOperation({ summary: 'Registra fecha de entrevista y estado de completado (solo Bandeja de Aprobación)' })
  updateInterview(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.usersService.updateInterview(req.user.id, id, body);
  }
}
