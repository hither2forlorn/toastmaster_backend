import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SERVER_CONFIG_KEY, ServerConfig } from './config/server.config';
import { setupSwagger } from './documentation/swagger.config';
import * as express from 'express';
import serverless from 'serverless-http';

const expressApp = express();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new (require('@nestjs/platform-express').ExpressAdapter)(expressApp),
  );

  const configService = app.get(ConfigService);
  const serverConfig = configService.get<ServerConfig>(SERVER_CONFIG_KEY);

  app.enableCors({
    origin: ['http://localhost:3000', 'https://toastmaster-sooty.vercel.app'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix(serverConfig!.apiPrefix);

  setupSwagger(app);

  await app.init();
}

bootstrap();

export const handler = serverless(expressApp);
