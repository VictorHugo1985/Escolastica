import { Module } from '@nestjs/common';
import { ClasesService } from './clases.service';
import { ClasesController } from './clases.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [ClasesController],
  providers: [ClasesService],
  exports: [ClasesService],
})
export class ClasesModule {}
