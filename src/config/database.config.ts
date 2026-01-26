import { registerAs } from '@nestjs/config';

export const DATABASE_CONFIG_KEY = 'database';

export interface DatabaseConfig {
  url: string;
  synchronize: boolean;
  logging: boolean;
}

// const env = process.env.NODE_ENV ?? 'production';
// const isProd = env === 'production';
const isProd = 'production';

export const databaseConfig = registerAs(DATABASE_CONFIG_KEY, () => ({
  url: process.env.DATABASE_URL,
  synchronize: !isProd && process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
}));
