import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Username of the user',
    example: 'john_doe',
  })
  @IsString()
  @Length(7, 20)
  fullName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john@yopmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password of the user',
    example: 'user@12345',
  })
  @IsString()
  @Length(8, 255)
  password: string;
}

export class UpdateUserDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    required: false,
  })
  @IsString()
  @Length(7, 100)
  fullName?: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john@yopmail.com',
    required: false,
  })
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Short introduction or bio of the user',
    example: 'Passionate public speaker and Toastmaster enthusiast.',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  introduction?: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'currentPass123',
  })
  @IsString()
  @Length(8, 255)
  currentPassword: string;

  @ApiProperty({
    description: 'New password to set',
    example: 'newPass456',
  })
  @IsString()
  @Length(8, 255)
  newPassword: string;

  @ApiProperty({
    description: 'Confirm new password (must match newPassword)',
    example: 'newPass456',
  })
  @IsString()
  @Length(8, 255)
  confirmPassword: string;
}
