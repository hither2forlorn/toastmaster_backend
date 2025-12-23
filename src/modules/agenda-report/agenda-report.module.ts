import { Module } from '@nestjs/common';
import { AgendaReportController } from './agenda-report.controller';
import { AgendaReportService } from './agenda-report.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendaReport } from './entities/agenda-report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AgendaReport])],
  controllers: [AgendaReportController],
  providers: [AgendaReportService],
  exports: [AgendaReportService]
})
export class AgendaReportModule {}
