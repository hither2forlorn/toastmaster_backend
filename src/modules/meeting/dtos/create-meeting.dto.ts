import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDate,
  IsNumber,
  IsArray,
  IsUrl,
  ArrayMaxSize,
} from 'class-validator';

export class CreateMeetingDto {
  @ApiProperty({ description: 'Meeting number', example: 1 })
  @IsNumber()
  meetingNo: number;

  @ApiProperty({
    description: 'Theme of the meeting',
    example: 'Annual Budget Discussion',
  })
  @IsString()
  @IsNotEmpty()
  theme: string;

  @ApiProperty({
    description: 'Date of the meeting',
    type: String,
    format: 'date-time',
    example: '2025-12-20T10:00:00Z',
  })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty({ description: 'Time of the meeting', example: '14:30:00' })
  @IsString()
  @IsNotEmpty()
  time: string;

  @ApiProperty({
    description: 'Venue of the meeting',
    example: 'Conference Room A',
  })
  @IsString()
  @IsNotEmpty()
  venue: string;

  @ApiProperty({
    description: 'ID of the club this meeting belongs to',
    example: 'uuid-of-club',
  })
  @IsString()
  @IsNotEmpty()
  clubId: string;

  @ApiProperty({
    description: 'Up to 3 social media links for marketing posts',
    example: ['https://www.facebook.com/share/p/1GEJAbFd4s/'],
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsUrl({}, { each: true })
  socialLinks?: string[];
}
