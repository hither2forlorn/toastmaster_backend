import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AddMeetingNoteDto {
  @ApiProperty({
    description: 'Notes to add',
    example: 'Discuss annual budget',
  })
  @IsString()
  @IsNotEmpty()
  notes: string;

  @ApiProperty({
    description: 'ID of the club',
    example: 'uuid-of-club',
  })
  @IsString()
  @IsNotEmpty()
  clubId: string;
}
