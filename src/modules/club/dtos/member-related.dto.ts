import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { ClubRole } from '../enum/club-role.enum';

export class GetMemberRoleDto {
  @ApiProperty({ example: 'club-123' })
  @IsString()
  clubId: string;

  @ApiProperty({ example: 'user-456' })
  @IsString()
  userId: string;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ example: 'member-789' })
  @IsString()
  memberId: string;

  @ApiProperty({ example: 'club-123' })
  @IsString()
  clubId: string;

  @ApiProperty({
    example: ClubRole.ADMIN,
    description: 'New role to assign to the member',
    enum: ClubRole,
  })
  @IsString()
  @IsEnum(ClubRole)
  newRole: ClubRole;
}
