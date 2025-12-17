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
    const club = req.params?.clubId || req.body?.clubId || req.query?.clubId;

    if (!user || !club) {
      return false;
    }

    const profile = await this.userService.getProfile(user.sub);

    const memberOf = profile?.member_of || [];
    const adminOf = profile?.admin_of || [];
    const ownedClubs = profile?.owned_clubs || [];

    const isMember = memberOf.some((c: { id: string }) => c.id === club);
    const isAdmin = adminOf.some((c: { id: string }) => c.id === club);
    const isOwner = ownedClubs.some((c: { id: string }) => c.id === club);

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
