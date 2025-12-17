import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProdDatabaseFactory implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    return {
      type: 'postgres',
      url: databaseUrl,
      synchronize: false,
      logging: false,
      autoLoadEntities: true,
      ssl: {
        rejectUnauthorized: false,
      },
      extra: {
        max: 5,
        min: 1,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,

        statement_timeout: 30000,
        query_timeout: 30000,
      },
    };
  }
}
