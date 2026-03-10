import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class JoinClubByCodeDto {
  @ApiProperty({
    example: 'ABC123',
    description: 'The unique code of the club',
  })
  @IsString()
  clubCode: string;
}

export class AddToClubDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Name of the club member to be added',
  })
  @IsOptional()
  @IsString()
  memberName: string;

  @ApiPropertyOptional({
    example: 'john@yopmail',
  })
  @IsOptional()
  @IsEmail()
  memberEmail: string;

  @ApiPropertyOptional({
    example: 'user-uuid-1234',
    description: 'The user ID if the member is a registered user',
  })
  @IsOptional()
  @IsString()
  userId: string;

  @ApiPropertyOptional({
    example: 'PN-67598269',
    description: 'Toastmasters International member ID',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}-\d+$/, {
    message: 'Invalid Toastmasters ID format (e.g. PN-67598269)',
  })
  toastmasterId?: string;
}

export class UpdateToastmasterIdDto {
  @ApiPropertyOptional({
    example: 'PN-67598269',
    description: 'Toastmasters International member ID',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}-\d+$/, {
    message: 'Invalid Toastmasters ID format (e.g. PN-67598269)',
  })
  toastmasterId: string | null;
}
