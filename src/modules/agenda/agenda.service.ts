import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Agenda } from './entities/agenda.entity';
import { Repository } from 'typeorm';
import { CreateAgendaDto } from './dtos/create-agenda.dto';
import { ClubMemberService } from '../club/club-member.service';
import { ClubService } from '../club/club.service';

@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(Agenda) private readonly agendaRepo: Repository<Agenda>,
    private readonly memberService: ClubMemberService,
    private readonly clubService: ClubService,
  ) {}

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
      const clubs = await this.clubService.getUserClubs(member.userId);
      const clubIds = clubs.map((c) => c.id);

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

    await this.agendaRepo.delete(agenda.id);

    return { message: 'Agenda deleted successfully' };
  }

  async updateSequenceOfAgendas(meetingId: string, agendaOrder: string[]) {
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
}
