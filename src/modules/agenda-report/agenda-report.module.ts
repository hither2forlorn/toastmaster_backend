import { Module } from '@nestjs/common';
import { AgendaReportController } from './agenda-report.controller';
import { AgendaReportService } from './agenda-report.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendaReport } from './entities/agenda-report.entity';
import { AgendaModule } from '../agenda/agenda.module';
import { ClubModule } from '../club/club.module';
import { MeetingModule } from '../meeting/meeting.module';
import { UserModule } from '../user/user.module';
import { ClubMemberService } from '../club/club-member.service';
import { AgendaTemplateModule } from '../agenda-template/agenda-template.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgendaReport]),
    AgendaModule,
    ClubModule,
    MeetingModule,
    UserModule,
    AgendaTemplateModule
  ],
  controllers: [AgendaReportController],
  providers: [AgendaReportService],
  exports: [AgendaReportService]
})
export class AgendaReportModule {}
