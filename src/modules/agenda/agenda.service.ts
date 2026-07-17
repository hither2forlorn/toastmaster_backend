import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Agenda } from './entities/agenda.entity';
import { Meeting } from '../meeting/entities/meeting.entity';
import { In, Repository } from 'typeorm';
import { CreateAgendaDto } from './dtos/create-agenda.dto';
import { ClubMemberService } from '../club/club-member.service';
import { MembershipStatus } from '../club/enum/club-members.enum';
import { RoleService } from '../role/role.service';

export interface GrammarianAgendaData {
  agendaId: string;
  memberId: string;
  userId: string;
  roleName: string;
}

@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(Agenda) private readonly agendaRepo: Repository<Agenda>,
    @InjectRepository(Meeting)
    private readonly meetingRepo: Repository<Meeting>,
    private readonly memberService: ClubMemberService,
    private readonly roleService: RoleService,
  ) {}

  private async assertMeetingNotPast(meetingId: string): Promise<void> {
    const meeting = await this.meetingRepo.findOne({
      where: { id: meetingId },
    });
    if (!meeting) throw new BadRequestException('Meeting not found');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const meetingDate = new Date(meeting.date);
    meetingDate.setHours(0, 0, 0, 0);
    if (meetingDate < today) {
      throw new BadRequestException('Cannot modify agenda for a past meeting');
    }
  }

  // utils function
  private async resolveMember(data: CreateAgendaDto, clubId: string) {
    if (!data.memberId && !data.memberName) {
      return { isGuest: false };
    }

    if (!data.memberId) {
      return { isGuest: true };
    }

    const membership = await this.memberService.getMemberRole(
      clubId,
      data.memberId,
    );

    if (!membership.member) {
      throw new BadRequestException(
        'Member does not belong to the specified club',
      );
    }

    return { isGuest: false };
  }

  // Resolve a roleId (from the roles table) into the agenda's denormalized
  // roleName. Falls back to the raw provided value when no matching role row
  // exists, so custom/free-text role names keep working.
  private async resolveRole(
    data: Partial<CreateAgendaDto> & { roleId?: string },
  ): Promise<{ roleId?: string; roleName: string | null }> {
    if (data.roleId) {
      const role = await this.roleService.getRoleById(data.roleId);
      if (role) {
        return { roleId: role.id, roleName: role.type };
      }
      return { roleId: data.roleId, roleName: data.roleName ?? null };
    }
    if (data.roleName) {
      const role = await this.roleService.getAgendaRoleByName(data.roleName);
      if (role) {
        return { roleId: role.id, roleName: role.type };
      }
    }
    return { roleId: data.roleId, roleName: data.roleName ?? null };
  }

  async createAgenda(data: CreateAgendaDto, clubId: string): Promise<Agenda> {
    await this.assertMeetingNotPast(data.meetingId);

    const memberData = await this.resolveMember(data, clubId);
    const roleData = await this.resolveRole(data);

    const agenda = this.agendaRepo.create({
      ...data,
      ...memberData,
      ...roleData,
    });

    return this.agendaRepo.save(agenda);
  }

  async createAgendasBulk(
    agendas: CreateAgendaDto[],
    clubId: string,
  ): Promise<Agenda[]> {
    if (agendas.length === 0) return [];
    await this.assertMeetingNotPast(agendas[0].meetingId);

    const created = await Promise.all(
      agendas.map(async (data) => {
        const memberData = await this.resolveMember(data, clubId);
        const roleData = await this.resolveRole(data);
        return this.agendaRepo.create({ ...data, ...memberData, ...roleData });
      }),
    );

    return this.agendaRepo.save(created);
  }

  async getAgendaById(agendaId: string): Promise<Agenda> {
    const agenda = await this.agendaRepo.findOne({
      where: { id: agendaId },
    });
    if (!agenda) {
      throw new BadRequestException('Agenda not found');
    }
    return agenda;
  }
  async getAllAgendasOfMeeting(meetingId: string): Promise<Agenda[]> {
    const agendas = await this.agendaRepo.find({
      where: { meetingId },
      order: { sequence: 'ASC' },
      relations: ['member'],
    });
    // For registered-member assignments, always use the current name from the User table
    return agendas.map((agenda) => {
      if (!agenda.isGuest && agenda.member) {
        agenda.memberName = agenda.member.fullName;
      }
      return agenda;
    });
  }

  async getAgendaStatsOfMeeting(
    meetingId: string,
  ): Promise<{ totalAgendas: number; guestMembers: number }> {
    const stats = await this.agendaRepo
      .createQueryBuilder('agenda')
      .select('COUNT(agenda.id)', 'totalAgendas')
      .addSelect(
        'SUM(CASE WHEN agenda.is_guest = true THEN 1 ELSE 0 END)',
        'guestMembers',
      )
      .where('agenda.meeting_id = :meetingId', { meetingId })
      .getRawOne();

    return {
      totalAgendas: parseInt(stats.totalAgendas, 10),
      guestMembers: parseInt(stats.guestMembers, 10),
    };
  }

  async updateAgenda(
    agendaId: string,
    data: Partial<CreateAgendaDto> & { roleId?: string },
  ): Promise<Agenda> {
    const agenda = await this.getAgendaById(agendaId);
    await this.assertMeetingNotPast(agenda.meetingId);

    if (agenda.isGuest === false && data.memberName) {
      throw new BadRequestException(
        'Cannot update memberName for registered members',
      );
    }

    const roleData = await this.resolveRole(data);
    Object.assign(agenda, data, roleData);
    return this.agendaRepo.save(agenda);
  }

  async deleteAgenda(agendaId: string): Promise<{ message: string }> {
    const agenda = await this.getAgendaById(agendaId);
    await this.assertMeetingNotPast(agenda.meetingId);

    await this.agendaRepo.delete(agenda.id);

    return { message: 'Agenda deleted successfully' };
  }

  async assignRoleToAgenda(agendaId: string, roleId: string): Promise<Agenda> {
    const agenda = await this.getAgendaById(agendaId);
    const roleData = await this.resolveRole({ roleId });

    agenda.roleId = roleData.roleId;
    agenda.roleName = roleData.roleName;
    return this.agendaRepo.save(agenda);
  }
  async getRoleCounts(clubId: string) {
    const roleCounts = await this.agendaRepo
      .createQueryBuilder('agenda')
      .innerJoin('agenda.meeting', 'meeting')
      .leftJoin('users', 'u', 'u.id = agenda.member_id')
      .select('agenda.roleName', 'role')
      .addSelect('COALESCE(u.full_name, agenda.member_name)', 'memberName')
      .addSelect('COUNT(agenda.roleName)', 'count')
      .where('meeting.clubId = :clubId', { clubId })
      .groupBy('agenda.roleName')
      .addGroupBy('COALESCE(u.full_name, agenda.member_name)')
      .getRawMany();

    return roleCounts.map((item) => ({
      role: item.role,
      memberName: item.memberName,
      count: parseInt(item.count, 10),
    }));
  }
  async updateSequenceOfAgendas(meetingId: string, agendaOrder: string[]) {
    await this.assertMeetingNotPast(meetingId);
    const agendas = await this.agendaRepo.find({ where: { meetingId } });
    const agendaMap = new Map(agendas.map((a) => [a.id, a]));

    for (const agendaId of agendaOrder) {
      if (!agendaMap.has(agendaId)) {
        throw new BadRequestException('Invalid agendaId');
      }
    }

    if (agendaOrder.length === 0) {
      return { message: 'Agenda reordered successfully' };
    }

    await this.agendaRepo.manager.transaction(async (manager) => {
      // Step 1: Shift all sequences to a high range to avoid unique constraint
      // violations when swapping (e.g. seq 1↔2 would briefly create two rows with seq=2)
      await manager.query(
        'UPDATE agendas SET sequence = sequence + 10000 WHERE meeting_id = $1',
        [meetingId],
      );
      // Step 2: Apply the new ordering
      for (let i = 0; i < agendaOrder.length; i++) {
        await manager.query('UPDATE agendas SET sequence = $1 WHERE id = $2', [
          i + 1,
          agendaOrder[i],
        ]);
      }
    });

    return { message: 'Agenda reordered successfully' };
  }

  async getAgendaIdByMeetingId(
    meetingId: string,
  ): Promise<GrammarianAgendaData[] | null> {
    const reportRoleNames = await this.roleService.getAgendaRoleNamesByKeys([
      'GRAMMARIAN',
      'AH_COUNTER',
    ]);

    const agenda = await this.agendaRepo
      .createQueryBuilder('a')
      .innerJoin('meetings', 'm', 'm.id = a.meeting_id')
      .innerJoin(
        'club_member',
        'cm',
        'cm.user_id = a.member_id AND cm.club_id = m.club_id',
      )
      .select('a.id', 'agendaId')
      .addSelect('a.member_id', 'memberId')
      .addSelect('cm.user_id', 'userId')
      .addSelect('a.role_name', 'roleName')
      .where('m.id = :meetingId', { meetingId })
      .andWhere('a.role_name IN (:...roles)', { roles: reportRoleNames })
      .andWhere('cm.status = :status', { status: MembershipStatus.ACTIVE })
      .getRawMany();

    if (!agenda) {
      throw new BadRequestException(
        'Agenda with Grammarian role in given meeting not found',
      );
    }

    return agenda;
  }

  async canLoggedInUserCreatReport(
    userId: string,
    meetingId: string,
  ): Promise<Agenda | null> {
    const reportRoleNames = await this.roleService.getAgendaRoleNamesByKeys([
      'GRAMMARIAN',
      'AH_COUNTER',
    ]);

    return await this.agendaRepo.findOne({
      where: {
        meetingId: meetingId,
        roleName: In(reportRoleNames),
        member: {
          id: userId,
        },
      },
      relations: ['member', 'meeting'],
    });
  }

  async getAllParticipantsOfMeeting(meetingId: string) {
    return await this.agendaRepo.find({
      where: { meetingId: meetingId },
      relations: ['member'],
    });
  }
}
