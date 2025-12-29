import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateAgendaDto {
  @ApiProperty({
    description: 'The title of the agenda',
    example: 'Weekly Meeting',
  })
  @IsString()
  title: string;

  // @ApiProperty({
  //   description: 'The date of the agenda',
  //   example: '2024-12-31T10:00:00Z',
  // })
  // @IsDate()
  // @Type(() => Date)
  // date: Date;

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
  @IsNotEmpty()
  @IsString()
  meetingId: string;

  @ApiProperty({
    description: 'The ID of the member (optional)',
    example: 'member-123',
    required: false,
  })
  @IsOptional()
  @IsString()
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

  @ApiProperty({
    example: 'clubId',
  })
  @IsString()
  clubId: string;
}

export class EditAgendaDto extends PartialType(CreateAgendaDto) {}
