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

@Injectable()
export class ClubMemberService {
  constructor(
    @InjectRepository(ClubMember)
    private readonly memberRepo: Repository<ClubMember>,
    @InjectRepository(Club)
    private readonly clubRepo: Repository<Club>,
    private readonly userService: UserService,
  ) {}

  async getClubMembers(clubId: string): Promise<ClubMember[]> {
    const members = await this.memberRepo
      .createQueryBuilder('member')
      .select([
        'member.id',
        'member.memberName',
        'member.memberEmail',
        'member.dateJoined',
        'member.role',
        'CASE WHEN member.userId IS NOT NULL THEN true ELSE false END AS "isRegisteredUser"',
      ])
      .where('member.clubId = :clubId', { clubId })
      .orderBy('member.dateJoined', 'ASC')
      .getRawMany();

    if (!members) {
      throw new NotFoundException('No members found for this club');
    }

    return members;
  }

  async getMemberById(memberId: string): Promise<ClubMember> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId },
      relations: ['user', 'club'],
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  async addMemberToClub(
    clubId: string,
    options: {
      memberName?: string;
      memberEmail?: string;
      userId?: string;
    },
  ): Promise<ClubMember> {
    const { memberName, memberEmail, userId } = options;

    const club = await this.clubRepo.findOne({ where: { id: clubId } });
    if (!club) throw new NotFoundException('Club not found');

    let finalName = memberName;
    let finalEmail = memberEmail;
    let finalUserId = userId || null;

    if (userId) {
      const user = await this.userService.getUserById(userId);
      finalName = user.fullName;
      finalEmail = user.email;
      finalUserId = user.id;
    }

    const existing = await this.memberRepo.findOne({
      where: [
        ...(finalUserId ? [{ clubId, userId: finalUserId }] : []),
        { clubId, memberEmail: finalEmail },
      ],
    });

    if (existing)
      throw new BadRequestException('Member already exists in this club');

    const newMember = this.memberRepo.create({
      clubId,
      memberName: finalName,
      memberEmail: finalEmail,
      userId: finalUserId,
      role: club.ownerId === finalUserId ? ClubRole.OWNER : ClubRole.MEMBER,
    });

    return await this.memberRepo.save(newMember);
  }

  async removeMemberFromClub(memberId: string): Promise<{ message: string }> {
    const member = await this.memberRepo.findOne({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Member not found');

    await this.memberRepo.remove(member);
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

  async getMemberRole(
    clubId: string,
    userId: string,
  ): Promise<{ member: boolean; role: ClubRole | null }> {
    const member = await this.memberRepo.findOne({
      where: { clubId, userId },
      select: ['role'],
    });

    if (member) {
      return { member: true, role: member.role };
    }

    return { member: false, role: null };
  }

  async updateRole(memberId: string, newRole: ClubRole, clubId: string) {
    const member = await this.memberRepo.findOne({
      where: { id: memberId, clubId },
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
  }> {
    const stats = await this.memberRepo
      .createQueryBuilder('member')
      .select('COUNT(member.id)', 'totalMembers')
      .addSelect(
        'SUM(CASE WHEN member.userId IS NOT NULL THEN 1 ELSE 0 END)',
        'registeredUsers',
      )
      .addSelect(
        'SUM(CASE WHEN member.userId IS NULL THEN 1 ELSE 0 END)',
        'guestMembers',
      )
      .where('member.clubId = :clubId', { clubId })
      .getRawOne();

    /* can use this alternative but it uses three queries instead of one */

    // const totalMembers = await this.repo.count({ where: { clubId } });
    // const registeredUsers = await this.repo.count({
    //   where: { clubId, userId: Not(IsNull()) },
    // });
    // const guestMembers = await this.repo.count({
    //   where: { clubId, userId: IsNull() },
    // });

    return {
      totalMembers: parseInt(stats.totalMembers, 10),
      registeredUsers: parseInt(stats.registeredUsers, 10),
      guestMembers: parseInt(stats.guestMembers, 10),
    };
  }
}
