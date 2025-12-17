import { Module } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agenda } from './entities/agenda.entity';
import { ClubModule } from '../club/club.module';

@Module({
  imports: [TypeOrmModule.forFeature([Agenda]), ClubModule],
  controllers: [AgendaController],
  providers: [AgendaService],
  exports: [AgendaService],
})
export class AgendaModule {}
