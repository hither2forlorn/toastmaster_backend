import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ClubMeetingFrequency } from '../enum/club-meeting-frequency.enum';

export class CreateClubDto {
  @ApiProperty({
    description: 'Name of the Toastmasters club',
    maxLength: 100,
    example: 'Oratory Masters Club',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Short description of the club',
    maxLength: 255,
    example: 'A friendly club focused on leadership and communication skills.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({
    description: 'District number or name',
    maxLength: 100,
    example: 'District 41',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  district?: string;

  @ApiPropertyOptional({
    description: 'Area designation',
    maxLength: 100,
    example: 'Area B1',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  area?: string;

  @ApiPropertyOptional({
    description: 'Division designation',
    maxLength: 100,
    example: 'Division B',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  division?: string;

  @ApiPropertyOptional({
    description: 'Club meeting frequency',
    enum: ClubMeetingFrequency,
    example: ClubMeetingFrequency.WEEKLY,
  })
  @IsEnum(ClubMeetingFrequency)
  @IsOptional()
  meetingFrequency?: ClubMeetingFrequency;

  @ApiPropertyOptional({
    description: 'Charter date of the club',
    example: '2023-05-15',
  })
  @Transform(({ value }) => value || undefined)
  @IsDateString()
  @IsOptional()
  charterDate?: string;
}
