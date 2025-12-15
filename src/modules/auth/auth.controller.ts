import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dtos/login-user.dto';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('/login')
  login(@Body() loginDto: LoginUserDto) {
    return this.authService.login(loginDto);
  }
}
