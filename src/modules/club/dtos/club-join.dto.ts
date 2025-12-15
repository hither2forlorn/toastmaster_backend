import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

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
}
