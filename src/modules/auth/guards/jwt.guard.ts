import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const [, token] = authHeader.split(' ');
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const payload = await this.authService.verifyToken(token);
    req.user = payload;
    return true;
  }
}
