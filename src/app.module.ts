import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { serverConfig } from './config/server.config';
import { databaseConfig } from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseFactory } from './database/database.factory';
import { DatabaseProductionFactory } from './database/database-production.factory';
import { tokenConfig } from './config/token.config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ClubModule } from './modules/club/club.module';
import { JwtGuard } from './modules/auth/guards/jwt.guard';
import { MeetingModule } from './modules/meeting/meeting.module';
import { SharedModule } from './common/modules/shared.module';
import { AgendaTemplateModule } from './modules/agenda-template/agenda-template.module';
import { AgendaModule } from './modules/agenda/agenda.module';
import { ProdDatabaseFactory } from './database/prod.database.factory';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: isProduction ? '.env.production' : '.env',
      cache: true,
      load: [serverConfig, databaseConfig, tokenConfig],
    }),
    TypeOrmModule.forRootAsync({
<<<<<<< HEAD
      useClass: isProduction ? DatabaseProductionFactory : DatabaseFactory,
=======
      useClass:
        process.env.NODE_ENV === 'production'
          ? ProdDatabaseFactory
          : DatabaseFactory,
>>>>>>> 776a8e28515124a720143cb9c9049de7c5bfdaf9
      inject: [ConfigService],
    }),
    SharedModule,
    ClubModule,
    MeetingModule,
    AgendaTemplateModule,
    AgendaModule,
  ],
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
