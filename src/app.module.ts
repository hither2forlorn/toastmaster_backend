import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { serverConfig } from './config/server.config';
import { databaseConfig } from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseFactory } from './database/database.factory';
import { UserController } from './modules/user/user.controller';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { tokenConfig } from './config/token.config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ClubModule } from './modules/club/club.module';
import { JwtGuard } from './modules/auth/guards/jwt.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
      load: [serverConfig, databaseConfig, tokenConfig],
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseFactory,
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    ClubModule,
  ],
  controllers: [UserController],
  providers: [
    {
      provide: 'APP_FILTER',
      useClass: GlobalExceptionFilter,
    },
    {
      provide: 'APP_INTERCEPTOR',
      useClass: ResponseInterceptor,
    },
    {
      provide: 'APP_GUARD',
      useClass: JwtGuard,
    },
  ],
})
export class AppModule {}
