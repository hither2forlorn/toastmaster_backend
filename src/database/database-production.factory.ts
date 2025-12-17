import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import {
  DATABASE_CONFIG_KEY,
  DatabaseConfig,
} from 'src/config/database.config';

@Injectable()
export class DatabaseProductionFactory implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(
    connectionName?: string,
  ): Promise<TypeOrmModuleOptions> | TypeOrmModuleOptions {
    // Check if DATABASE_URL is provided (Supabase, Neon, etc.)
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    if (databaseUrl) {
      // Use DATABASE_URL directly (for Supabase pooling, Neon, Railway, etc.)
      return {
        type: 'postgres',
        url: databaseUrl,
        synchronize: false, // Never sync in production!
        logging: false,
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        ssl: {
          rejectUnauthorized: false, // Required for managed databases
        },
        extra: {
          max: 5, // Maximum pool size for serverless
          min: 0,
          idle: 10000, // Close idle connections after 10s
          connectionTimeoutMillis: 10000,
        },
      };
    }

    // Fallback to individual DB config variables
    const dbConfig =
      this.configService.getOrThrow<DatabaseConfig>(DATABASE_CONFIG_KEY);

    const { host, port, username, password, database, synchronize, logging } =
      dbConfig;

    return {
      type: 'postgres',
      host,
      port,
      username,
      password,
      database,
      synchronize: false, // Never sync in production!
      logging: false,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      ssl: {
        rejectUnauthorized: false, // For managed databases like Neon, Supabase, etc.
      },
      extra: {
        max: 5, // Maximum pool size for serverless
        min: 0, // Minimum pool size
        idle: 10000, // Close idle connections after 10s
        connectionTimeoutMillis: 10000,
      },
    };
  }
}
