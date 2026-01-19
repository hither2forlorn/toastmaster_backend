import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import {
  DATABASE_CONFIG_KEY,
  DatabaseConfig,
} from 'src/config/database.config';

@Injectable()
export class DatabaseFactory implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}
  createTypeOrmOptions(
    connectionName?: string,
  ): Promise<TypeOrmModuleOptions> | TypeOrmModuleOptions {
    const dbConfig =
      this.configService.getOrThrow<DatabaseConfig>(DATABASE_CONFIG_KEY);

    const { url, synchronize, logging } = dbConfig;

    return {
      type: 'postgres',
      url,
      synchronize,
      logging,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    };
  }
}
