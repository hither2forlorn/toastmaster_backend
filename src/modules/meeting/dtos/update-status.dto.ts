import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { MEETING_STATUS } from '../enum/meeting-status.enum';

export class UpdateMeetingStatusDto {
  @ApiProperty({ description: 'Meeting ID', example: 'uuid-of-meeting' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'New status of the meeting',
    enum: MEETING_STATUS,
    example: MEETING_STATUS.SCHEDULED,
  })
  @IsEnum(MEETING_STATUS)
  @IsNotEmpty()
  status: MEETING_STATUS;
}
