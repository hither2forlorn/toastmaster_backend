import { registerAs } from '@nestjs/config';

export const SERVER_CONFIG_KEY = 'server';

export interface ServerConfig {
  port: number;
  host: string;
  apiPrefix: string;
  swaggerPath: string;
  corsOrigin: string[];
}

export const serverConfig = registerAs<ServerConfig>(SERVER_CONFIG_KEY, () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',
  apiPrefix: process.env.API_PREFIX || 'api',
  swaggerPath: process.env.SWAGGER_PATH || '/api/docs',
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000'],
}));
