import { PartialType } from '@nestjs/swagger';
import { CreateAgendaTemplateDto } from './create-agenda-template.dto';

export class UpdateAgendaTemplateDto extends PartialType(
  CreateAgendaTemplateDto,
) {}
