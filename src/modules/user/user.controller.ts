import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from './dtos/user.dto';
import { UserService } from './user.service';
import { Public } from 'src/common/decorators/public.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@Public()
@Controller('user')
@ApiTags('User')
export class UserController {
  constructor(private userService: UserService) {}
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({
    description: 'The user has been successfully created.',
  })
  @ApiBadRequestResponse({
    description: 'User with this email already exists.',
  })
  @Post('/register')
  registerUser(@Body() userDto: CreateUserDto) {
    return this.userService.registerUser(userDto);
  }

  @Get('/me')
  getProfile(@GetUser('sub') userId: string) {
    return this.userService.getProfile(userId);
  }
}
