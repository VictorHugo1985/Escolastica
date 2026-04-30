import { Module } from '@nestjs/common';
import { SesionesService } from './sesiones.service';
import { AsistenciasService } from './asistencias.service';
import { SesionesController } from './sesiones.controller';

@Module({
  controllers: [SesionesController],
  providers: [SesionesService, AsistenciasService],
  exports: [SesionesService, AsistenciasService],
})
export class SesionesModule {}
