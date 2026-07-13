import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
  Matches,
  Min,
  Max,
  IsOptional,
  IsDate,
  IsBoolean,
} from 'class-validator';
import { MEETING_STATUS } from '../enum/meeting-status.enum';
import { MEETING_TYPE } from '../enum/meeting-type.enum';

class AgendaItemDto {
  @ApiProperty({
    description: 'Title of the agenda item',
    example: 'Table Topics Session',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Role name for the agenda item',
    example: 'Toastmaster',
  })
  @IsString()
  @IsNotEmpty()
  roleName: string;

  @ApiProperty({
    description: 'Duration in minutes',
    example: 15,
    minimum: 1,
    maximum: 300,
  })
  @IsNumber()
  @Min(1)
  @Max(300)
  duration: number;

  @ApiProperty({
    description: 'ID of the member assigned to this agenda',
    example: 'uuid-of-member',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  memberId: string | null;

  @ApiProperty({
    description: 'Name of the guest assigned (only required when assignmentType is "guest")',
    example: 'John Doe',
    minLength: 2,
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  memberName?: string | null;

  @ApiProperty({
    description: 'Sequence order of the agenda item',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  sequence: number;

  @ApiProperty({
    description: 'Additional notes for the agenda item',
    example: 'Prepare 3 topics',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  notes: string | null;

  @ApiProperty({
    description: 'Type of assignment',
    enum: ['member', 'guest'],
    example: 'member',
  })
  @IsEnum(['member', 'guest'])
  assignmentType: 'member' | 'guest';
}

export class CreateMeetingWithTemplateDto {
  @ApiProperty({
    description: 'Theme of the meeting',
    example: 'Annual Budget Discussion',
  })
  @IsString()
  @IsNotEmpty()
  theme: string;

  @ApiProperty({
    description: 'ID of the club this meeting belongs to',
    example: 'uuid-of-club',
  })
  @IsString()
  @IsNotEmpty()
  clubId: string;

  @ApiProperty({ description: 'Meeting number', example: 1 })
  @Type(() => Number)
  @IsNumber()
  meetingNo: number;

  @ApiProperty({
    description: 'Date of the meeting',
    type: String,
    format: 'date-time',
    example: '2025-12-20T10:00:00Z',
  })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty({
    description: 'Venue of the meeting',
    example: 'Conference Room A',
  })
  @IsString()
  @IsNotEmpty()
  venue: string;

  @ApiProperty({
    description: 'Status of the meeting',
    enum: MEETING_STATUS,
    example: MEETING_STATUS.SCHEDULED,
  })
  @IsEnum(MEETING_STATUS)
  status: MEETING_STATUS;

  @ApiProperty({
    description: 'Type of the meeting',
    enum: MEETING_TYPE,
    example: MEETING_TYPE.PHYSICAL,
  })
  @IsEnum(MEETING_TYPE)
  @IsNotEmpty()
  meetingType: MEETING_TYPE;

  @ApiProperty({
    description: 'Time of the meeting in HH:mm:ss format',
    example: '14:30:00',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}:\d{2}$/, {
    message: 'Invalid time format. Expected HH:mm:ss',
  })
  time: string;

  @ApiProperty({
    description: 'Additional notes for the meeting',
    example: 'Bring budget documents',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  notes: string | null;

  @ApiProperty({
    description: 'Array of agenda items for the meeting',
    type: [AgendaItemDto],
    minItems: 1,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgendaItemDto)
  @IsNotEmpty()
  agendas: AgendaItemDto[];
}
