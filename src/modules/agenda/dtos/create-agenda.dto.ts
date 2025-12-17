import {
  IsString,
  IsDate,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAgendaDto {
  @ApiProperty({
    description: 'The title of the agenda',
    example: 'Weekly Meeting',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'A brief description of the agenda',
    required: false,
    example: 'This is the agenda for our weekly team meeting.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The date of the agenda',
    example: '2024-12-31T10:00:00Z',
  })
  @IsDate()
  @Type(() => Date)
  date: Date;

  @ApiProperty({
    description: 'The role name associated with the agenda',
    example: 'President',
  })
  @IsString()
  roleName: string;

  @ApiProperty({
    description: 'The duration of the agenda in minutes',
    example: 60,
  })
  @IsNumber()
  duration: number;

  @ApiProperty({
    description: 'The sequence number of the agenda item',
    example: 1,
  })
  @IsNumber()
  sequence: number;

  @ApiProperty({
    description: 'The ID of the meeting',
    example: 'meeting-123',
  })
  @IsMongoId()
  meetingId: string;

  @ApiProperty({
    description: 'The ID of the member (optional)',
    example: 'member-123',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  memberId?: string;

  @ApiProperty({
    description: 'The name of the member (optional)',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  memberName?: string;

  @ApiProperty({
    description: 'Additional notes for the agenda (optional)',
    required: false,
    example: 'Please prepare your presentation in advance.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
