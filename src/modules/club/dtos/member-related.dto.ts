import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { RoleKey } from 'src/modules/role/enum/role-key.enum';

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
    example: RoleKey.VP_EDUCATION,
    description: 'New role key to assign to the member',
    enum: RoleKey,
  })
  @IsString()
  @IsEnum(RoleKey)
  newRole: RoleKey;
}
