import { SetMetadata } from '@nestjs/common';
import { ClubRole } from 'src/modules/club/enum/club-role.enum';

export const ROLE_KEY = 'roles';

export const Roles = (...roles: ClubRole[]) => SetMetadata(ROLE_KEY, roles);
