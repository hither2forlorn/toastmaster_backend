import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateMeetingDto } from './create-meeting.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateMeetingDto extends PartialType(CreateMeetingDto) {
  @ApiProperty({
    description: 'ID of the meeting to update',
    example: 'uuid-of-meeting',
  })
  @IsString()
  @IsNotEmpty()
  meetingId: string;
}
