import {
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

@Injectable()
export class MeetingService {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepo: Repository<Meeting>,
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

  async getMeetingById(id: string): Promise<Meeting> {
    const meeting = await this.meetingRepo.findOne({ where: { id } });
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }
    return meeting;
  }

  async getMeetingsByClub(
    clubId: string,
    page = 1,
    limit = 10,
    status?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Meeting[]> {
    const whereClause: any = { clubId };

    if (status) {
      whereClause.status = status;
    }

    if (startDate && endDate) {
      whereClause.date = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      whereClause.date = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      whereClause.date = LessThanOrEqual(new Date(endDate));
    }

    const meetings = await this.meetingRepo.find({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      order: { date: 'DESC' },
    });

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
    return await this.meetingRepo.manager.transaction(
      async (transactionalEntityManager) => {
        const meeting = transactionalEntityManager.create(Meeting, {
          meetingNo: Number(meetingData.meetingNo),
          theme: meetingData.theme,
          date: meetingData.date,
          time: meetingData.time,
          venue: meetingData.venue,
          notes: meetingData.notes ?? undefined,
          clubId: meetingData.clubId,
          status: meetingData.status,
        });

        const savedMeeting = await transactionalEntityManager.save(meeting);

        const agendaEntities = transactionalEntityManager.create(
          Agenda,
          agendas.map((agenda) => ({
            title: agenda.title,
            roleName: agenda.roleName,
            duration: agenda.duration,
            sequence: agenda.sequence,
            memberId: agenda.memberId ?? undefined,
            memberName: agenda.memberName,
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
