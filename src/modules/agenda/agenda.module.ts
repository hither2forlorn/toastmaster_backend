import { Module } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agenda } from './entities/agenda.entity';
import { Meeting } from '../meeting/entities/meeting.entity';
import { ClubModule } from '../club/club.module';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Agenda, Meeting]),
    ClubModule,
    RoleModule,
  ],
  controllers: [AgendaController],
  providers: [AgendaService],
  exports: [AgendaService],
})
export class AgendaModule {}
