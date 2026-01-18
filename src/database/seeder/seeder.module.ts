import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { User } from 'src/modules/user/entities/user.entity';
import { Club } from 'src/modules/club/entities/club.entity';
import { ClubMember } from 'src/modules/club/entities/club-member.entity';
import { Meeting } from 'src/modules/meeting/entities/meeting.entity';
import { Agenda } from 'src/modules/agenda/entities/agenda.entity';
import { AgendaReport } from 'src/modules/agenda-report/entities/agenda-report.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Club,
      ClubMember,
      Meeting,
      Agenda,
      AgendaReport,
    ]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
