import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import express from 'express';
import { AppModule } from './app.module';

const expressServer = express();
// Límite más alto que el default (100kb) para admitir la foto de perfil del
// socio, que se sube como data URL en base64 dentro del body JSON.
expressServer.use(express.json({ limit: '5mb' }));
expressServer.use(express.urlencoded({ extended: true, limit: '5mb' }));

async function createApp() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressServer), { bodyParser: false });
  app.enableCors();
  app.setGlobalPrefix('api');
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
  await app.init();
  return app;
}

// En Vercel (runtime serverless) este módulo se importa y se invoca el handler
// exportado por cada request, en vez de correr bootstrap() con app.listen().
let appReady: Promise<unknown> | null = null;

export default async function handler(req: express.Request, res: express.Response) {
  if (!appReady) appReady = createApp();
  await appReady;
  expressServer(req, res);
}

// Localmente (nest start / nest start --watch) sí queremos levantar un server real.
if (require.main === module) {
  createApp().then(() => expressServer.listen(process.env.PORT || 3000));
}
