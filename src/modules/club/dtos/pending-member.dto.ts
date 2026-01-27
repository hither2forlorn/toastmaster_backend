import { MembershipStatus } from "../enum/club-members.enum";
import { ClubRole } from "../enum/club-role.enum";

export class PendingMemberDto {
  id: string;
  memberName: string;
  memberEmail: string;
  dateJoined: Date;
  status: MembershipStatus;
  role: ClubRole;
}

export class ClubWithPendingMembersDto {
  id: string;
  name: string;
  members: PendingMemberDto[];
}