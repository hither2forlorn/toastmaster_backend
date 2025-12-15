import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { LoginUserDto } from './dtos/login-user.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginUserDto): Promise<{ token: string }> {
    const { email, password } = loginDto;

    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await user.comparePassword(password);

    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };

    const token = await this.generateToken(payload);

    return { token };
  }

  async generateToken(payload: {
    sub: string;
    email: string;
  }): Promise<string> {
    const token = await this.jwtService.signAsync(payload);

    if (!token) {
      throw new InternalServerErrorException('Token generation failed');
    }

    return token;
  }

  async verifyToken(token: string): Promise<any> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
