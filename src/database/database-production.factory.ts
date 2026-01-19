import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DATABASE_CONFIG_KEY,
  DatabaseConfig,
} from 'src/config/database.config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class DatabaseProductionFactory implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(
    connectionName?: string,
  ): Promise<TypeOrmModuleOptions> | TypeOrmModuleOptions {
    const dbConfig =
      this.configService.getOrThrow<DatabaseConfig>(DATABASE_CONFIG_KEY);

    const { url } = dbConfig;

    if (!url) {
      throw new Error(
        'DATABASE_URL environment variable is required for production',
      );
    }

    console.log('Connecting to database with URL:', url);

    return {
      type: 'postgres',
      url,
      synchronize: false, // Never auto-sync in production!
      logging: true,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      ssl: {
        rejectUnauthorized: false, // Required for Supabase, Render, etc.
      },
      extra: {
        max: 10, // Maximum pool size for Render
        min: 2, // Minimum pool size
        idle: 10000, // Close idle connections after 10s
        connectionTimeoutMillis: 10000,
      },
    };
  }
}
