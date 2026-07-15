import { InjectRepository } from '@nestjs/typeorm';
import { ClubMember } from './entities/club-member.entity';
import { Repository } from 'typeorm';
import { Club } from './entities/club.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { ClubRole } from './enum/club-role.enum';
import { MembershipStatus } from './enum/club-members.enum';
import { ClubWithPendingMembersDto } from './dtos/pending-member.dto';
import { PendingRequestDecisionDto } from './dtos/pending-request-decision.dto';

@Injectable()
export class ClubMemberService {
  constructor(
    @InjectRepository(ClubMember)
    private readonly memberRepo: Repository<ClubMember>,
    @InjectRepository(Club)
    private readonly clubRepo: Repository<Club>,
    private readonly userService: UserService,
  ) {}

  async getPendingMembersForClub(clubId: string): Promise<any[]> {
    const members = await this.memberRepo
      .createQueryBuilder('member')
      .leftJoin('member.user', 'user')
      .select([
        'member.id',
        'member.clubId',
        'member.userId',
        'member.dateJoined',
        'member.status',
        'member.role',
        'user.fullName AS "memberName"',
        'user.email AS "memberEmail"',
      ])
      .where('member.clubId = :clubId', { clubId })
      .andWhere('member.status = :status', { status: MembershipStatus.PENDING })
      .getRawMany();

    return members.map((m) => ({
      id: m.member_id,
      clubId: m.member_club_id,
      userId: m.member_user_id,
      memberName: m.memberName,
      memberEmail: m.memberEmail,
      dateJoined: m.member_date_joined,
      status: m.member_status,
      role: m.member_role,
    }));
  }

  async getClubMembers(clubId: string): Promise<ClubMember[]> {
    const members = await this.memberRepo
      .createQueryBuilder('member')
      .leftJoin('member.user', 'user')
      .select([
        'member.id',
        'member.clubId',
        'member.userId',
        'member.dateJoined',
        'member.role',
        'member.status',
        'user.fullName AS "memberName"',
        'user.email AS "memberEmail"',
        'user.introduction',
        'CASE WHEN member.userId IS NOT NULL THEN true ELSE false END AS "isRegisteredUser"',
      ])
      .where('member.clubId = :clubId', { clubId })
      .andWhere('member.status = :status', { status: MembershipStatus.ACTIVE })
      .orderBy('member.dateJoined', 'ASC')
      .getRawMany();

    if (!members || members.length === 0) {
      throw new NotFoundException('No members found for this club');
    }

    return members;
  }

  async getMemberById(memberId: string): Promise<ClubMember> {
    const member = await this.memberRepo.findOne({
      where: {
        id: memberId,
        status: MembershipStatus.ACTIVE,
      },
      relations: ['user', 'club'],
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  async getUserClubs(userId: string): Promise<Club[]> {
    const memberships = await this.memberRepo.find({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
      },
      relations: ['club'],
    });

    return memberships.map((membership) => membership.club);
  }

  async addMemberToClub(
    clubId: string,
    options: { userId: string },
  ): Promise<ClubMember> {
    const { userId } = options;

    const club = await this.clubRepo.findOne({ where: { id: clubId } });
    if (!club) throw new NotFoundException('Club not found');

    const existing = await this.memberRepo.findOne({
      where: { clubId, userId },
    });

    if (existing)
      throw new BadRequestException('Member already exists in this club');

    const newMember = this.memberRepo.create({
      clubId,
      userId,
      role: club.ownerId === userId ? ClubRole.OWNER : ClubRole.MEMBER,
      status: MembershipStatus.ACTIVE,
    });

    return await this.memberRepo.save(newMember);
  }

  // Owner adds a member by name + email; resolves to a userId via email
  // lookup (existing user) or creates a new user when none is found.
  async addMemberToClubByEmail(
    clubId: string,
    options: { memberName: string; memberEmail: string },
  ): Promise<ClubMember> {
    const { memberName, memberEmail } = options;

    const user = await this.userService.findOrCreateByEmail(
      memberName,
      memberEmail,
    );

    return this.addMemberToClub(clubId, { userId: user.id });
  }

  async addMemberToClubV2(
    clubId: string,
    options: { userId: string; addedByOwner?: boolean },
  ): Promise<ClubMember> {
    const { userId, addedByOwner = false } = options;

    const club = await this.clubRepo.findOne({ where: { id: clubId } });
    if (!club) throw new NotFoundException('Club not found');

    const existing = await this.memberRepo.findOne({
      where: { clubId, userId },
    });

    if (existing) {
      if (existing.status === MembershipStatus.REJECTED) {
        throw new BadRequestException('Your previous request was rejected');
      }
      if (existing.status === MembershipStatus.PENDING) {
        throw new BadRequestException('You already have a pending request');
      }
      throw new BadRequestException('Member already exists in this club');
    }

    const isOwner = club.ownerId === userId;

    const newMember = this.memberRepo.create({
      clubId,
      userId,
      role: isOwner ? ClubRole.OWNER : ClubRole.MEMBER,
      status:
        addedByOwner || isOwner
          ? MembershipStatus.ACTIVE
          : MembershipStatus.PENDING,
    });

    return await this.memberRepo.save(newMember);
  }

  async removeMemberFromClub(
    memberId: string,
    clubId: string,
  ): Promise<{ message: string }> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId, clubId },
    });
    if (!member) throw new NotFoundException('Member not found in this club');

    const club = await this.clubRepo.findOne({ where: { id: clubId } });
    if (club && member.userId && club.ownerId === member.userId) {
      throw new BadRequestException(
        'Cannot remove the club owner. Transfer ownership before removing this member.',
      );
    }

    await this.memberRepo.delete(memberId);
    return { message: 'Member removed from club successfully' };
  }

  async joinClubByCode(clubCode: string, userId: string): Promise<ClubMember> {
    const club = await this.clubRepo.findOne({ where: { clubCode } });
    if (!club) throw new NotFoundException('Club not found with this code');

    const existing = await this.memberRepo.findOne({
      where: { clubId: club.id, userId },
    });

    if (existing)
      throw new BadRequestException('User already a member of this club');

    return await this.addMemberToClub(club.id, { userId });
  }

  async joinClubByCodeV2(
    clubCode: string,
    userId: string,
  ): Promise<ClubMember> {
    const club = await this.clubRepo.findOne({ where: { clubCode } });
    if (!club) throw new NotFoundException('Club not found with this code');

    const existing = await this.memberRepo.findOne({
      where: { clubId: club.id, userId },
    });

    if (existing) {
      if (existing.status === MembershipStatus.ACTIVE) {
        throw new BadRequestException('You are already a member of this club');
      }
      if (existing.status === MembershipStatus.PENDING) {
        throw new BadRequestException(
          'You already have a pending join request for this club',
        );
      }
      if (existing.status === MembershipStatus.REJECTED) {
        throw new BadRequestException(
          'Your previous request to join this club was rejected. Please contact the club owner.',
        );
      }
    }

    return await this.addMemberToClubV2(club.id, {
      userId,
      addedByOwner: false,
    });
  }

  async getPendingRequestToJoinClubByCode(
    userId: string,
  ): Promise<ClubWithPendingMembersDto[]> {
    const clubs = await this.clubRepo
      .createQueryBuilder('club')
      .leftJoinAndSelect('club.members', 'member', 'member.status = :status', {
        status: 'pending',
      })
      .leftJoinAndSelect('member.user', 'memberUser')
      .leftJoin(
        'club.members',
        'adminMember',
        'adminMember.userId = :userId AND adminMember.role = :adminRole AND adminMember.status = :activeStatus',
        { userId, adminRole: ClubRole.ADMIN, activeStatus: MembershipStatus.ACTIVE },
      )
      .where('club.ownerId = :userId OR adminMember.id IS NOT NULL', { userId })
      .getMany();

    if (!clubs || clubs.length === 0) {
      return [];
    }

    return clubs
      .filter((club) => club.members.length > 0)
      .map((club) => ({
        id: club.id,
        name: club.name,
        description: club.description,
        members: club.members.map((m) => ({
          id: m.id,
          memberName: m.user?.fullName ?? '',
          memberEmail: m.user?.email ?? '',
          dateJoined: m.dateJoined,
          status: m.status,
          role: m.role,
        })),
      }));
  }

  async getMemberRole(
    clubId: string,
    userId: string,
  ): Promise<{ member: boolean; role: ClubRole | null }> {
    const member = await this.memberRepo.find({
      where: {
        clubId,
        userId,
        status: MembershipStatus.ACTIVE,
      },
      select: ['role'],
    });

    if (member.length > 0) {
      return { member: true, role: member[0].role };
    }

    return { member: false, role: null };
  }

  async updateRole(memberId: string, newRole: ClubRole, clubId: string) {
    const member = await this.memberRepo.findOne({
      where: {
        id: memberId,
        clubId,
        status: MembershipStatus.ACTIVE,
      },
    });
    if (!member) throw new NotFoundException('Member not found');

    member.role = newRole;
    await this.memberRepo.save(member);
    return { message: 'Member role updated successfully' };
  }

  async generateMemberStats(clubId: string): Promise<{
    totalMembers: number;
    registeredUsers: number;
    guestMembers: number;
    pendingMembers: number;
  }> {
    const stats = await this.memberRepo
      .createQueryBuilder('member')
      .select(
        'SUM(CASE WHEN member.status = :active THEN 1 ELSE 0 END)',
        'totalMembers',
      )
      .addSelect(
        'SUM(CASE WHEN member.userId IS NOT NULL AND member.status = :active THEN 1 ELSE 0 END)',
        'registeredUsers',
      )
      .addSelect(
        'SUM(CASE WHEN member.userId IS NULL AND member.status = :active THEN 1 ELSE 0 END)',
        'guestMembers',
      )
      .addSelect(
        'SUM(CASE WHEN member.status = :pending THEN 1 ELSE 0 END)',
        'pendingMembers',
      )
      .where('member.clubId = :clubId', { clubId })
      .setParameter('active', MembershipStatus.ACTIVE)
      .setParameter('pending', MembershipStatus.PENDING)
      .getRawOne();

    return {
      totalMembers: parseInt(stats.totalMembers, 10) || 0,
      registeredUsers: parseInt(stats.registeredUsers, 10) || 0,
      guestMembers: parseInt(stats.guestMembers, 10) || 0,
      pendingMembers: parseInt(stats.pendingMembers, 10) || 0,
    };
  }

  async pendingRequestDecision(
    pendingRequestDecisionDto: PendingRequestDecisionDto,
    userId: string,
  ) {
    const member = await this.memberRepo.findOne({
      where: {
        id: pendingRequestDecisionDto.memberId,
      },
      relations: ['club'],
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const isOwner = member.club.ownerId === userId;
    const isAdmin = await this.memberRepo.findOne({
      where: {
        clubId: member.clubId,
        userId,
        role: ClubRole.ADMIN,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!isOwner && !isAdmin) {
      throw new BadRequestException(
        'You are not authorized to make this decision',
      );
    }

    if (pendingRequestDecisionDto.decision) {
      member.status = MembershipStatus.ACTIVE;
      await this.memberRepo.save(member);
      return { message: 'Membership request approved' };
    } else if (!pendingRequestDecisionDto.decision) {
      member.status = MembershipStatus.REJECTED;
      await this.memberRepo.save(member);
      return { message: 'Membership request rejected' };
    } else {
      throw new BadRequestException('Invalid decision value');
    }
  }

  async userClubStatus(userId: string) {
    const memberships = await this.memberRepo.find({
      select: ['clubId', 'status'],
      where: {
        userId,
      },
    });
    if (memberships.length === 0) {
      throw new NotFoundException('No club memberships found for this user');
    }

    return memberships;
  }
}
