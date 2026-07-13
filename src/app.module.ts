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
import { AgendaReportModule } from './modules/agenda-report/agenda-report.module';
import { SeederModule } from './database/seeder/seeder.module';
import { RoleModule } from './modules/role/role.module';

// Detect environment
const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: isProduction ? '.env' : '.env',
      cache: true,
      load: [serverConfig, databaseConfig, tokenConfig],
    }),
    TypeOrmModule.forRootAsync({
      useClass: isProduction ? DatabaseProductionFactory : DatabaseFactory,
      inject: [ConfigService],
    }),
    SharedModule,
    ClubModule,
    MeetingModule,
    AgendaTemplateModule,
    AgendaModule,
    AgendaReportModule,
    SeederModule,
    RoleModule,
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
