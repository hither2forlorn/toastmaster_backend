import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Agenda } from './entities/agenda.entity';
import { Meeting } from '../meeting/entities/meeting.entity';
import { In, Repository } from 'typeorm';
import { CreateAgendaDto } from './dtos/create-agenda.dto';
import { ClubMemberService } from '../club/club-member.service';
import { ClubService } from '../club/club.service';
import { MembershipStatus } from '../club/enum/club-members.enum';

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
    @InjectRepository(Meeting) private readonly meetingRepo: Repository<Meeting>,
    private readonly memberService: ClubMemberService,
  ) {}

  private async assertMeetingNotPast(meetingId: string): Promise<void> {
    const meeting = await this.meetingRepo.findOne({ where: { id: meetingId } });
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
  private validateMemberInput(data: CreateAgendaDto) {
    if (!data.memberId && !data.memberName) {
      throw new BadRequestException(
        'Either memberId or memberName must be provided',
      );
    }
  }

  // utils function
  private async resolveMember(data: CreateAgendaDto) {
    if (!data.memberId) {
      return { isGuest: true };
    }

    const member = await this.memberService.getMemberById(data.memberId);

    if (member.userId) {
      const clubs = await this.memberService.getUserClubs(member.userId);
      console.log(clubs);
      const clubIds = clubs.map((c) => c.id);

      console.log(clubIds);

      if (!clubIds.includes(member.clubId)) {
        throw new BadRequestException(
          'Member does not belong to the specified club',
        );
      }
    }

    return {
      isGuest: false,
      memberName: member.memberName,
    };
  }

  async createAgenda(data: CreateAgendaDto, clubId: string): Promise<Agenda> {
    await this.assertMeetingNotPast(data.meetingId);
    this.validateMemberInput(data);

    const memberData = await this.resolveMember(data);

    const agenda = this.agendaRepo.create({
      ...data,
      ...memberData,
    });

    return this.agendaRepo.save(agenda);
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
    return this.agendaRepo.find({
      where: { meetingId },
      order: { sequence: 'ASC' },
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
    data: Partial<CreateAgendaDto>,
  ): Promise<Agenda> {
    const agenda = await this.getAgendaById(agendaId);
    await this.assertMeetingNotPast(agenda.meetingId);

    if (agenda.isGuest === false && data.memberName) {
      throw new BadRequestException(
        'Cannot update memberName for registered members',
      );
    }

    Object.assign(agenda, data);
    return this.agendaRepo.save(agenda);
  }

  async deleteAgenda(agendaId: string): Promise<{ message: string }> {
    const agenda = await this.getAgendaById(agendaId);
    await this.assertMeetingNotPast(agenda.meetingId);

    await this.agendaRepo.delete(agenda.id);

    return { message: 'Agenda deleted successfully' };
  }

  async assignRoleToAgenda(
    agendaId: string,
    roleName: string,
  ): Promise<Agenda> {
    const agenda = await this.getAgendaById(agendaId);

    agenda.roleName = roleName;
    return this.agendaRepo.save(agenda);
  }
  async getRoleCounts(clubId: string) {
    const roleCounts = await this.agendaRepo
      .createQueryBuilder('agenda')
      .innerJoin('agenda.meeting', 'meeting')
      .select('agenda.roleName', 'role')
      .addSelect('agenda.memberName', 'memberName')
      .addSelect('COUNT(agenda.roleName)', 'count')
      .where('meeting.clubId = :clubId', { clubId })
      .groupBy('agenda.roleName')
      .addGroupBy('agenda.memberName')
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

    agendaOrder.forEach((agendaId, index) => {
      const agenda = agendaMap.get(agendaId);
      if (!agenda) throw new BadRequestException('Invalid agendaId');
      agenda.sequence = index + 1;
    });

    await this.agendaRepo.save([...agendaMap.values()]);

    return { message: 'Agenda reordered successfully' };
  }

  async getAgendaIdByMeetingId(
    meetingId: string,
  ): Promise<GrammarianAgendaData[] | null> {
    const agenda = await this.agendaRepo
      .createQueryBuilder('a')
      .innerJoin('meetings', 'm', 'm.id = a.meeting_id')
      .innerJoin('club_member', 'cm', 'cm.id = a.member_id')
      .select('a.id', 'agendaId')
      .addSelect('a.member_id', 'memberId')
      .addSelect('cm.user_id', 'userId')
      .addSelect('a.role_name', 'roleName')
      .where('m.id = :meetingId', { meetingId })
      .andWhere('a.role_name IN (:...roles)', {
        roles: ['Grammarian', 'Ah Counter'],
      })
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
    return await this.agendaRepo.findOne({
      where: {
        meetingId: meetingId,
        roleName: In(['Grammarian', 'Ah Counter']),
        member: {
          userId,
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
