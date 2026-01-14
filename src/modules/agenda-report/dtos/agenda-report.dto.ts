import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReportType } from '../entities/agenda-report.entity';

export class MemberEvaluationDto {
  @ApiProperty()
  @IsString()
  memberId: string;

  @ApiProperty()
  @IsString()
  memberName: string;

  @ApiPropertyOptional()
  @IsOptional()
  wordUsageCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  examples?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  grammarIssues?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string;
}

export class FillerWordCountDto {
  @ApiProperty()
  @IsString()
  memberId: string;

  @ApiProperty()
  @IsString()
  memberName: string;

  @ApiPropertyOptional()
  @IsOptional()
  ahs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  ums?: number;

  @ApiPropertyOptional()
  @IsOptional()
  likes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  other?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string;
}

export class CreateAgendaReportDto {
  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType)
  @IsNotEmpty()
  reportType: ReportType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  wordOfTheDay?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  wordOfTheDayDefinition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  grammarNotes?: string;

  @ApiPropertyOptional({ type: [MemberEvaluationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MemberEvaluationDto)
  memberEvaluations?: MemberEvaluationDto[];

  @ApiPropertyOptional({ type: [FillerWordCountDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FillerWordCountDto)
  fillerWordCounts?: FillerWordCountDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  overallNotes?: string;
}
