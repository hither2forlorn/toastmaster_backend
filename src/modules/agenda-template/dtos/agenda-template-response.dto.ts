import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AGENDA_ROLE } from '../enum/agenda-role.enum';

export class AgendaTemplateItemResponseDto {
  @ApiProperty({ example: 'item-123' })
  id: string;

  @ApiProperty({ example: 'Call to Order' })
  title: string;

  @ApiPropertyOptional({ enum: AGENDA_ROLE })
  systemRole?: AGENDA_ROLE;

  @ApiPropertyOptional({ example: 'Guest Speaker Introducer' })
  customRole?: string;

  @ApiProperty({ example: 2 })
  duration: number;

  @ApiProperty({ example: 1 })
  sequence: number;

  @ApiProperty({ example: 'template-123' })
  agendaTemplateId: string;
}

export class AgendaTemplateResponseDto {
  @ApiProperty({ example: 'template-123' })
  id: string;

  @ApiProperty({ example: 'Standard Club Meeting' })
  name: string;

  @ApiPropertyOptional({ example: 'Default template for regular meetings' })
  description?: string;

  @ApiPropertyOptional({ example: 'club-123' })
  clubId?: string;

  @ApiProperty({ example: false })
  isDefault: boolean;

  @ApiProperty({ type: [AgendaTemplateItemResponseDto] })
  items: AgendaTemplateItemResponseDto[];

  @ApiProperty({ example: '2024-12-15T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-12-15T10:00:00Z' })
  updatedAt: Date;
}
