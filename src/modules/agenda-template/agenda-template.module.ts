import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendaTemplate } from './entity/agenda-template.entity';
import { AgendaTemplateItem } from './entity/agenda-item.entity';
import { AgendaTemplateService } from './agenda-template.service';
import {
  SystemTemplateController,
  ClubTemplateController,
} from './agenda-template.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AgendaTemplate, AgendaTemplateItem])],
  controllers: [SystemTemplateController, ClubTemplateController],
  providers: [AgendaTemplateService],
  exports: [AgendaTemplateService],
})
export class AgendaTemplateModule {}
