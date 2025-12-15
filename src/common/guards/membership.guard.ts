import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClubRole } from 'src/modules/club/enum/club-role.enum';
import { UserService } from 'src/modules/user/user.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class MembershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredRoles = this.reflector.getAllAndOverride<ClubRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const club = req.params.clubId;

    if (!user || !club) {
      return false;
    }

    const profile = await this.userService.getProfile(user.sub);

    const isMember = profile.member_of.some((c) => c.id === club);
    const isAdmin = profile.admin_of.some((c) => c.id === club);
    const isOwner = profile.owned_clubs.some((c) => c.id === club);

    if (!isMember && !isAdmin && !isOwner) {
      return false;
    }

    req.clubRole = isOwner
      ? ClubRole.OWNER
      : isAdmin
        ? ClubRole.ADMIN
        : ClubRole.MEMBER;

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const hasRole = requiredRoles.includes(req.clubRole);

    if (!hasRole) {
      return false;
    }

    return true;
  }
}
