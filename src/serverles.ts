import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './documentation/swagger.config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SERVER_CONFIG_KEY, ServerConfig } from './config/server.config';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

const expressApp = express();
let cachedApp: NestExpressApplication;

async function bootstrap() {
  if (cachedApp) {
    return cachedApp;
  }

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  const configService = app.get(ConfigService);
  const serverConfig = configService.get<ServerConfig>(SERVER_CONFIG_KEY);

  // CORS for production
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix(serverConfig!.apiPrefix || 'api');

  // Setup Swagger only in non-production or if explicitly enabled
  if (process.env.ENABLE_SWAGGER === 'true') {
    setupSwagger(app);
  }

  await app.init();

  cachedApp = app;
  return app;
}

// Vercel serverless handler
export default async (req: any, res: any) => {
  await bootstrap();
  return expressApp(req, res);
};
