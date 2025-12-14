import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import 'reflect-metadata';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // validação global dos DTOs (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // habilitar CORS se a API for usada no front
  app.enableCors({
  origin: '*', // ou o host do frontend
  allowedHeaders: ['Content-Type', 'Authorization'],
});

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server running at http://localhost:3000`);
}

bootstrap();
