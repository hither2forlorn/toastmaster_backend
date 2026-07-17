import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Meeting } from './entities/meeting.entity';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { CreateMeetingDto } from './dtos/create-meeting.dto';
import { UpdateMeetingDto } from './dtos/update-meeting.dto';
import { MEETING_STATUS } from './enum/meeting-status.enum';
import { CreateMeetingWithTemplateDto } from './dtos/create-with-templete';
import { Agenda } from '../agenda/entities/agenda.entity';
import { UserService } from '../user/user.service';
import { ClubMemberService } from '../club/club-member.service';

@Injectable()
export class MeetingService {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepo: Repository<Meeting>,
    private readonly userService: UserService,
    private readonly memberService: ClubMemberService,
  ) {}

  async createMeeting(data: CreateMeetingDto): Promise<Meeting> {
    const lastMeeting = await this.meetingRepo.findOne({
      where: { clubId: data.clubId },
      order: { meetingNo: 'DESC' },
    });

    const nextMeetingNo = lastMeeting ? lastMeeting.meetingNo + 1 : 1;

    const newMeeting = this.meetingRepo.create({
      ...data,
      meetingNo: nextMeetingNo,
    });

    if (await this.meetingRepo.save(newMeeting)) {
      return newMeeting;
    }
    throw new InternalServerErrorException('Failed to create meeting');
  }

  async addNote(meetingId: string, notes: string) {
    const update = await this.meetingRepo.update({ id: meetingId }, { notes });
    if (update.affected === 0) {
      throw new NotFoundException('Meeting not found');
    }
    return { message: 'Notes added successfully' };
  }

  async deleteNote(meetingId: string) {
    const update = await this.meetingRepo.update(
      { id: meetingId },
      { notes: null },
    );
    if (update.affected === 0) {
      throw new NotFoundException('Meeting not found');
    }
    return { message: 'Notes deleted successfully' };
  }

  async updateMeetingStatus(meetingId: string, status: MEETING_STATUS) {
    const update = await this.meetingRepo.update({ id: meetingId }, { status });
    if (update.affected === 0) {
      throw new NotFoundException('Meeting not found');
    }
    return { message: 'Meeting status updated successfully' };
  }

  async updateNotes(meetingId: string, notes: string) {
    const update = await this.meetingRepo.update({ id: meetingId }, { notes });
    if (update.affected === 0) {
      throw new NotFoundException('Meeting not found');
    }
    return { message: 'Meeting notes updated successfully' };
  }

  async updateMeeting(data: UpdateMeetingDto, id: string) {
    const updateResult = await this.meetingRepo.update(id, data);

    if (updateResult.affected === 0) {
      throw new NotFoundException('Meeting not found');
    }

    return this.meetingRepo.findOne({ where: { id } });
  }

  private isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const meetingDate = new Date(date);
    meetingDate.setHours(0, 0, 0, 0);
    return meetingDate < today;
  }

  private async autoCompletePastMeetings(meetings: Meeting[]): Promise<void> {
    const pastScheduled = meetings.filter(
      (m) => m.status === MEETING_STATUS.SCHEDULED && this.isPastDate(m.date),
    );
    if (pastScheduled.length === 0) return;
    await Promise.all(
      pastScheduled.map((m) =>
        this.meetingRepo.update(m.id, { status: MEETING_STATUS.COMPLETED }),
      ),
    );
    pastScheduled.forEach((m) => (m.status = MEETING_STATUS.COMPLETED));
  }

  async getMeetingById(id: string): Promise<Meeting> {
    const meeting = await this.meetingRepo.findOne({ where: { id }, relations: ['agendas'] });
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }
    await this.autoCompletePastMeetings([meeting]);
    return meeting;
  }

  async getMeetingsByClub(
    clubId: string,
    userId: string,
    page = 1,
    limit = 10,
    status?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Meeting[]> {
    const profile = await this.userService.getProfile(userId);
    const isMember =
      profile?.member_of?.some((c: { id: string }) => c.id === clubId) ||
      profile?.admin_of?.some((c: { id: string }) => c.id === clubId) ||
      profile?.owned_clubs?.some((c: { id: string }) => c.id === clubId);

    const whereClause: any = { clubId };

    if (status) {
      whereClause.status = status;
    }

    if (!isMember) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      whereClause.date = MoreThanOrEqual(today);
    } else {
      if (startDate && endDate) {
        whereClause.date = Between(new Date(startDate), new Date(endDate));
      } else if (startDate) {
        whereClause.date = MoreThanOrEqual(new Date(startDate));
      } else if (endDate) {
        whereClause.date = LessThanOrEqual(new Date(endDate));
      }
    }

    const meetings = await this.meetingRepo.find({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      order: { date: 'ASC' },
    });

    await this.autoCompletePastMeetings(meetings);
    return meetings;
  }
  async getUpcomingMeeting(
    page = 1,
    limit = 10,
    status?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }
    if (startDate && endDate) {
      whereClause.date = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      whereClause.date = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      whereClause.date = LessThanOrEqual(new Date(endDate));
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      whereClause.date = MoreThanOrEqual(today);
    }
    const upcomingMeeting = await this.meetingRepo.find({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      order: {
        date: 'ASC',
      },
    });
    if (upcomingMeeting.length === 0) {
      return [];
    }
    return upcomingMeeting;
  }

  async deleteMeeting(id: string) {
    const deleteResult = await this.meetingRepo.delete(id);

    if (deleteResult.affected === 0) {
      throw new NotFoundException('Meeting not found');
    }

    return { message: 'Meeting deleted successfully' };
  }

  async changeStatus(id: string) {
    return await this.meetingRepo.update(id, {
      status: MEETING_STATUS.COMPLETED,
    });
  }

  async getAllMeetingToSelectIt(page: number, limit: number) {
    const [allMeeting, total] = await this.meetingRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['agendas'],
    });

    if (allMeeting.length === 0) {
      throw new NotFoundException('Meeting not found');
    }

    const updatedData = allMeeting.map((m) => ({
      theme: m?.theme,
      time: m?.time,
      notes: m?.notes,
      agendas: m?.agendas.map((a) => ({
        title: a?.title,
        roleName: a?.roleName,
        duration: a?.duration,
        sequence: a?.sequence,
        notes: a?.notes,
      })),
    }));
    return { data: updatedData, total, page, limit };
  }

  async createMeetingUsingTemplet(data: CreateMeetingWithTemplateDto) {
    const { agendas, ...meetingData } = data;

    // Resolve any "toastmaster" assignments to their user IDs up front so the
    // agenda creation below can treat them like regular club members.
    const resolvedAgendas = await Promise.all(
      agendas.map(async (agenda) => {
        if (agenda.assignmentType === 'toastmaster') {
          if (!agenda.toastmasterId) {
            throw new BadRequestException(
              'Toastmasters ID is required when assignment type is "toastmaster"',
            );
          }
          const user = await this.userService.findByMemberId(
            agenda.toastmasterId,
          );
          if (!user) {
            throw new BadRequestException(
              'No user found with the provided Toastmasters ID',
            );
          }
          const membership = await this.memberService.getMemberRole(
            meetingData.clubId,
            user.id,
          );
          // User exists but is not a member of this club yet: auto-add them.
          if (!membership.member) {
            await this.memberService.addMemberToClub(meetingData.clubId, {
              userId: user.id,
            });
          }
          return { ...agenda, memberId: user.id, toastmasterId: undefined };
        }
        return agenda;
      }),
    );

    return await this.meetingRepo.manager.transaction(
      async (transactionalEntityManager) => {
        const meeting = transactionalEntityManager.create(Meeting, {
          meetingNo: Number(meetingData.meetingNo),
          theme: meetingData.theme,
          date: meetingData.date,
          time: meetingData.time,
          venue: meetingData.venue,
          notes: meetingData.notes ?? undefined,
          wordOfTheDay: meetingData.wordOfTheDay ?? undefined,
          idiomOfTheDay: meetingData.idiomOfTheDay ?? undefined,
          clubId: meetingData.clubId,
          status: meetingData.status,
          meetingType: meetingData.meetingType,
        });

        const savedMeeting = await transactionalEntityManager.save(meeting);

        const agendaEntities = transactionalEntityManager.create(
          Agenda,
          resolvedAgendas.map((agenda) => ({
            title: agenda.title,
            roleName: agenda.roleName,
            duration: agenda.duration,
            sequence: agenda.sequence,
            memberId: agenda.memberId ?? undefined,
            memberName: agenda.assignmentType === 'guest' ? agenda.memberName : undefined,
            notes: agenda.notes ?? undefined,
            isGuest: agenda.assignmentType === 'guest',
            meetingId: savedMeeting.id,
            clubId: meetingData.clubId,
          })),
        );

        await transactionalEntityManager.save(agendaEntities);

        return { clubId: meetingData.clubId };
      },
    );
  }
}
