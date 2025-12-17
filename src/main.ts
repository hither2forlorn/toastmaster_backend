import { SERVER_CONFIG_KEY, ServerConfig } from './config/server.config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './documentation/swagger.config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function server() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const serverConfig = configService.get<ServerConfig>(SERVER_CONFIG_KEY);

  app.enableCors({
    origin: 'http://localhost:3000',
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

  await app.listen(serverConfig!.port);
}

server();
