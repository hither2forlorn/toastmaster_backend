import { registerAs } from '@nestjs/config';

export const DATABASE_CONFIG_KEY = 'database';

export interface DatabaseConfig {
  url: string;
  synchronize: boolean;
  logging: boolean;
}

export const databaseConfig = registerAs(DATABASE_CONFIG_KEY, () => ({
  url: process.env.DATABASE_URL,
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
}));
