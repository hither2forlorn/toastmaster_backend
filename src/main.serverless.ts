import { SERVER_CONFIG_KEY, ServerConfig } from './config/server.config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './documentation/swagger.config';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const expressApp = express();
let cachedApp: any;

async function bootstrap() {
  if (cachedApp) {
    return cachedApp;
  }

  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter);

  const configService = app.get(ConfigService);
  const serverConfig = configService.get<ServerConfig>(SERVER_CONFIG_KEY);

  app.enableCors({
    origin: true, // Allow all origins in production, or specify your frontend domain
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
  cachedApp = app;

  return app;
}

export default async (req: any, res: any) => {
  await bootstrap();
  return expressApp(req, res);
};
