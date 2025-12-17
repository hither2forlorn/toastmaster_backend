import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from './dtos/user.dto';
import { UserService } from './user.service';
import { Public } from 'src/common/decorators/public.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@Controller('user')
@ApiBearerAuth()
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
  @Public()
  @Post('/register')
  registerUser(@Body() userDto: CreateUserDto) {
    return this.userService.registerUser(userDto);
  }

  @Get('/me')
  getProfile(@GetUser('sub') userId: string) {
    console.log(userId);
    return this.userService.getProfile(userId);
  }
}
