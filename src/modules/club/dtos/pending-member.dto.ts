import { MembershipStatus } from '../enum/club-members.enum';

export class PendingMemberDto {
  id: string;
  memberName: string;
  memberEmail: string;
  dateJoined: Date;
  status: MembershipStatus;
  role: string;
  roleName?: string;
}

export class ClubWithPendingMembersDto {
  id: string;
  name: string;
  members: PendingMemberDto[];
}
