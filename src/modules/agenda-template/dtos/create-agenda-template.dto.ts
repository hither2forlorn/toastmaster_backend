import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AgendaTemplateItemDto } from './agenda-item.dto';

export class CreateAgendaTemplateDto {
  @ApiProperty({ example: 'Standard Club Meeting' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Default template for regular meetings' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ type: [AgendaTemplateItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgendaTemplateItemDto)
  items: AgendaTemplateItemDto[];
}
