import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  const isProd = process.env.NODE_ENV === 'production';

  app.enableCors({
    origin: isProd
      ? (origin, callback) => {
          if (!origin || allowedOrigins.some((o) => origin.startsWith(o))) {
            callback(null, true);
          } else {
            callback(new Error(`Origin ${origin} not allowed`));
          }
        }
      : true, // dev: allow all origins (localhost + LAN IP)
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Escolastica API')
    .setDescription('API del sistema de gestión académica de Escuela NA')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`API corriendo en http://localhost:${port}`);
  console.log(`Swagger disponible en http://localhost:${port}/api/docs`);
}

bootstrap();
