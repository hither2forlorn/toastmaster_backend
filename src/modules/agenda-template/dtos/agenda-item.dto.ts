import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { AGENDA_ROLE } from '../enum/agenda-role.enum';

export class AgendaTemplateItemDto {
  @ApiProperty({ example: 'Call to Order' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ enum: AGENDA_ROLE, example: AGENDA_ROLE.PRESIDENT })
  @IsEnum(AGENDA_ROLE)
  @IsOptional()
  systemRole?: AGENDA_ROLE;

  @ApiPropertyOptional({ example: 'Guest Speaker Introducer' })
  @IsString()
  @IsOptional()
  customRole?: string;

  @ApiProperty({ example: 2, description: 'Duration in minutes' })
  @IsNumber()
  @Min(0)
  duration: number;

  @ApiProperty({ example: 1, description: 'Order in sequence' })
  @IsNumber()
  @Min(1)
  sequence: number;
}
