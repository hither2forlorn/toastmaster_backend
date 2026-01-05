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

  async getAllMemberOfMeeting(meetingId: string): Promise<Meeting | null> {
    return await this.meetingRepo.findOne({
      where: { id: meetingId },
      relations: ['club', 'club.members'],
    });
  }
}
