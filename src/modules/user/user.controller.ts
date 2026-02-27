import { Body, Controller, Get, Post, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
} from './dtos/user.dto';
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
    return this.userService.getProfile(userId);
  }

  @ApiOperation({ summary: 'Update profile details (name/email)' })
  @ApiBadRequestResponse({ description: 'Invalid data or email already used.' })
  @Patch('/me')
  updateProfile(@GetUser('sub') userId: string, @Body() data: UpdateUserDto) {
    return this.userService.updateProfile(userId, data);
  }

  @ApiOperation({ summary: 'Change password' })
  @ApiBadRequestResponse({
    description: 'Current password incorrect or invalid.',
  })
  @Patch('/me/password')
  changePassword(
    @GetUser('sub') userId: string,
    @Body() body: ChangePasswordDto,
  ) {
    return this.userService.changePassword(userId, body);
  }

  @Get('/my-clubs')
  @ApiOperation({ summary: 'Get all clubs where user is a member or owner' })
  @ApiCreatedResponse({
    description: 'Returns list of clubs with user role and membership details',
  })
  getUserClubs(@GetUser('sub') userId: string) {
    return this.userService.getUserClubs(userId);
  }
}
