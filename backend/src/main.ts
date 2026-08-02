import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      // Los mensajes de class-validator (ej. "dni must be a number string") son para debug,
      // no para mostrarle al usuario final. Devolvemos algo genérico y entendible en su lugar.
      exceptionFactory: () =>
        new BadRequestException('Revisá los datos ingresados: falta completar algo o hay un formato inválido.'),
    }),
  );
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
