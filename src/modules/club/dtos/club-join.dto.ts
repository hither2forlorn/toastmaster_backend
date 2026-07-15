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
  @ApiProperty({
    example: 'John Doe',
    description: 'Name of the member to add to the club',
  })
  @IsString()
  memberName: string;

  @ApiProperty({
    example: 'john@example.com',
    description:
      'Email of the member to add; an existing user is reused, otherwise a new user is created',
  })
  @IsEmail()
  memberEmail: string;
}
