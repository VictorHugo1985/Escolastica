import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AulasModule } from './aulas/aulas.module';
import { MateriasModule } from './materias/materias.module';
import { ClasesModule } from './clases/clases.module';
import { InscripcionesModule } from './inscripciones/inscripciones.module';
import { SesionesModule } from './sesiones/sesiones.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuditoriaModule,
    AuthModule,
    UsersModule,
    AulasModule,
    MateriasModule,
    ClasesModule,
    InscripcionesModule,
    SesionesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
