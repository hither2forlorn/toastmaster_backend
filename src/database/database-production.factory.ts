import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class DatabaseProductionFactory implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(
    connectionName?: string,
  ): Promise<TypeOrmModuleOptions> | TypeOrmModuleOptions {
    // Get DATABASE_URL from environment (Supabase connection string)
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL environment variable is required for production',
      );
    }

    return {
      type: 'postgres',
      url: databaseUrl,
      synchronize: false, // Never auto-sync in production!
      logging: false,
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
