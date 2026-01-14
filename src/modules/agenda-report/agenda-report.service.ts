import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AgendaReport, ReportType } from './entities/agenda-report.entity';
import { Repository } from 'typeorm';
import { AgendaService } from '../agenda/agenda.service';
import {
  CreateAgendaReportDto,
  MemberEvaluationDto,
} from './dtos/agenda-report.dto';
import { MeetingService } from '../meeting/meeting.service';

@Injectable()
export class AgendaReportService {
  constructor(
    @InjectRepository(AgendaReport)
    private readonly agendaReportRepo: Repository<AgendaReport>,
    // @InjectRepository(AgendaTemplateItem) private readonly agendaTempletItemRepo: Repository<AgendaTemplateItem>,
    private readonly agendaService: AgendaService,
    private readonly meetingService: MeetingService,
  ) {}

  async createAgendaReportGrammarian(
    meetingId: string,
    dto: CreateAgendaReportDto,
    userId: string,
  ): Promise<AgendaReport> {
    // console.log('dto :: ', dto);
    if (
      dto.reportType !== ReportType.GRAMMARIAN &&
      dto.reportType !== ReportType.AH_COUNTER
    ) {
      throw new BadRequestException(
        'Report type must match your assigned role',
      );
    }
    const agendas = await this.agendaService.getAgendaIdByMeetingId(meetingId);
    if (!agendas || agendas.length === 0) {
      throw new ForbiddenException('No agenda found');
    }

    // console.log('agendas :: ', agendas);
    const user = agendas.find((a) => a.userId === userId);
    if (!user) {
      throw new ForbiddenException('Not your agenda');
    }
    console.log('userids :: ', user);

    const roleNames = ['Ah Counter', 'Grammarian'];
    // console.log(roleNames);
    // console.log(dto.reportType);
    if (!roleNames.includes(user?.roleName)) {
      throw new BadRequestException(
        `${dto?.reportType} role does not create reports`,
      );
    }

    let report = await this.agendaReportRepo.findOne({
      where: { agendaId: user?.agendaId },
    });
    // console.log('report :: ', report);

    if (report) {
      if (dto.memberEvaluations && dto.memberEvaluations?.length !== 0) {
        if (!report.memberEvaluations) {
          report.memberEvaluations = [];
        }
        report.memberEvaluations.push(dto.memberEvaluations[0]);
        return await this.agendaReportRepo.save(report);
      }
      if (dto.fillerWordCounts && dto.fillerWordCounts?.length !== 0) {
        if (!report.fillerWordCounts) {
          report.fillerWordCounts = [];
        }
        report.fillerWordCounts.push(dto.fillerWordCounts[0]);
        return await this.agendaReportRepo.save(report);
      }
      throw new BadRequestException('Agenda Report creation fail');
    } else {
      report = this.agendaReportRepo.create({
        agendaId: user?.agendaId,
        ...dto,
      });
      // console.log('not reach here', report);
      return await this.agendaReportRepo.save(report);
    }
  }

  async getAgendaReportByAgendaReportId(agendaReportId: string) {
    const agendaReport = await this.agendaReportRepo.findOne({
      where: { id: agendaReportId },
    });
    if (!agendaReport) {
      throw new BadRequestException(
        "Agenda Report doesn't exist for this agenda report id",
      );
    }
    return agendaReport;
  }

  async getAgendaReportByMemberId(memberId: string) {
    const agendaReport = await this.agendaReportRepo.query(
      `
      SELECT DISTINCT
        ar.id,
        ar.created_at,
        ar.updated_at,
        ar.is_deleted,
        ar.agenda_id,
        ar.report_type,
        ar.word_of_the_day,
        ar.word_of_the_day_definition,
        ar.grammar_notes,
        ar.overall_notes,
        a.meeting_id,
        cm.club_id,
        (
          SELECT jsonb_agg(eval)
          FROM jsonb_array_elements(ar.member_evaluations) AS eval
          WHERE eval->>'memberId' = $1
        ) AS member_evaluations,
        (
          SELECT jsonb_agg(filler)
          FROM jsonb_array_elements(ar.filler_word_counts) AS filler
          WHERE filler->>'memberId' = $1
        ) AS filler_word_counts
      FROM agenda_reports ar
      INNER JOIN agendas a ON a.id = ar.agenda_id
      INNER JOIN club_member cm ON cm.id = a.member_id
      WHERE
        EXISTS (
          SELECT 1
          FROM jsonb_array_elements(ar.member_evaluations) AS eval
          WHERE eval->>'memberId' = $1
        )
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements(ar.filler_word_counts) AS filler
          WHERE filler->>'memberId' = $1
        );
      `,
      [memberId],
    );

    // console.log(memberId)
    // console.log(agendaReport);
    if (agendaReport?.length === 0) {
      throw new NotFoundException('No agenda reports found for this member');
    }

    return agendaReport;
  }

  async deleteAgendaReport(userId: string, reportId: string): Promise<boolean> {
    const reportData = await this.agendaReportRepo
      .createQueryBuilder('ar')
      .innerJoin('agendas', 'a', 'a.id = ar.agenda_id')
      .innerJoin('club_member', 'cm', 'cm.id = a.member_id')
      .select('ar.id', 'reportId')
      .addSelect('cm.user_id', 'userId')
      .where('ar.id = :reportId', { reportId })
      .getRawOne();

    if (!reportData) {
      throw new NotFoundException('Report not found');
    }

    if (reportData.userId !== userId) {
      throw new ForbiddenException("You can't delete this report");
    }

    const deleteResult = await this.agendaReportRepo.delete({ id: reportId });

    if (deleteResult.affected === 0) {
      throw new NotFoundException('Report could not be deleted');
    }

    return true;
  }

  async deleteAgendaReportByMemberId(
    userId: string,
    memberId: string,
    reportId: string,
  ): Promise<AgendaReport> {
    const report = await this.agendaReportRepo.findOne({
      where: { id: reportId },
      relations: ['agenda', 'agenda.member'],
    });
    // console.log(report)
    if (!report) {
      throw new NotFoundException(
        'No agenda report found with given report id',
      );
    }
    if (report.agenda.member?.userId !== userId) {
      throw new ForbiddenException('You cannot modify this resource');
    }

    if (report.memberEvaluations && report.memberEvaluations.length > 0) {
      if (!report.memberEvaluations) {
        report.memberEvaluations = [];
      }
      report.memberEvaluations = report.memberEvaluations.filter(
        (evaluation) => evaluation.memberId !== memberId,
      );

      return await this.agendaReportRepo.save(report);
    }
    if (report.fillerWordCounts && report.fillerWordCounts.length > 0) {
      if (!report.fillerWordCounts) {
        report.fillerWordCounts = [];
      }
      report.fillerWordCounts.filter((count) => count.memberId !== memberId);
      return await this.agendaReportRepo.save(report);
    }
    throw new NotFoundException(
      'No evaluation found for this member in the report',
    );
  }

  async editAgendaReportOfMemberByMemberId(
    userId: string,
    reportId: string,
    dto: CreateAgendaReportDto,
    memberId?: string,
  ): Promise<AgendaReport> {
    const report = await this.agendaReportRepo.findOne({
      where: { id: reportId },
      relations: ['agenda', 'agenda.member'],
    });

    if (!report) {
      throw new NotFoundException(
        'No agenda report found with given report id',
      );
    }

    if (report.agenda.member?.userId !== userId) {
      throw new ForbiddenException('You cannot modify this resource');
    }

    let hasChanges = false;

    if (dto.memberEvaluations && dto.memberEvaluations.length > 0) {
      if (!report.memberEvaluations) {
        report.memberEvaluations = [];
      }
      report.memberEvaluations = report.memberEvaluations.filter(
        (evaluation) => evaluation.memberId !== memberId,
      );
      report.memberEvaluations.push(dto.memberEvaluations[0]);
      hasChanges = true;
    }

    if (dto.fillerWordCounts && dto.fillerWordCounts.length > 0) {
      if (!report.fillerWordCounts) {
        report.fillerWordCounts = [];
      }
      report.fillerWordCounts = report.fillerWordCounts.filter(
        (count) => count.memberId !== memberId,
      );
      report.fillerWordCounts.push(dto.fillerWordCounts[0]);
      hasChanges = true;
    }

    const generalFields = [
      'wordOfTheDay',
      'wordOfTheDayDefinition',
      'grammarNotes',
      'overallNotes',
    ];
    for (const field of generalFields) {
      if (dto[field] !== undefined) {
        // console.log(`Updating ${field}:`, dto[field]);
        report[field] = dto[field];
        hasChanges = true;
      }
    }

    // console.log('hasChanges:', hasChanges);
    if (!hasChanges) {
      throw new BadRequestException('No data provided to update');
    }

    return await this.agendaReportRepo.save(report);
  }

  async canLoggedInUserCreatOrEditAgendaReport(
    userId: string,
    meetingId: string,
  ): Promise<any> {
    const report = await this.agendaService.canLoggedInUserCreatReport(
      userId,
      meetingId,
    );
    // console.log(report);

    if (!report) {
      throw new NotFoundException(
        'No agenda report found with given meeting id',
      );
    }

    const roleType = ['Grammarian', 'Ah Counter'];
    if (!roleType.includes(report.roleName)) {
      throw new BadRequestException("Sorry you can't creat this resources");
    }

    const meetingStatus = ['SCHEDULED', 'COMPLETED'];
    if (!meetingStatus.includes(report?.meeting?.status)) {
      throw new BadRequestException('Meeting has not started yet');
    }

    const isReportExist = await this.agendaReportRepo.findOne({
      where: {
        agenda: {
          meetingId: meetingId,
          member: {
            userId: userId,
            isDeleted: false,
          },
          isDeleted: false,
        },
      },
      // relations: ['agenda', 'agenda.member'],
    });
    // return isReportExist;

    const allParticipants =
      await this.agendaService.getAllParticipantsOfMeeting(meetingId);

    if (!allParticipants) {
      throw new NotFoundException('No user in givien meeting');
    }
    // return allParticipants;

    if (isReportExist) {
      const memberIdRoleMap = new Map<string, string>();
      allParticipants.forEach((m) => {
        if (m?.memberId && m?.roleName) {
          memberIdRoleMap.set(m.memberId, m.roleName);
        }
      });

      if (isReportExist?.memberEvaluations) {
        isReportExist?.memberEvaluations.forEach((m: MemberEvaluationDto) => {
          const role = memberIdRoleMap.get(m?.memberId);
          if (role) {
            m.role = role;
          }
        });
      } else if (isReportExist?.fillerWordCounts) {
        isReportExist?.fillerWordCounts.forEach((m: MemberEvaluationDto) => {
          const role = memberIdRoleMap.get(m?.memberId);
          if (role) {
            m.role = role;
          }
        });
      }

      const canLoggedInUserCreatOrEditAgendaReportReturn = {
        roleName: report?.roleName,
        status: report?.meeting?.status,
        meeting: null,
        report: isReportExist,
      };
      return canLoggedInUserCreatOrEditAgendaReportReturn;
    }

    const meetingDateTime = new Date(
      `${report.meeting.date.toISOString().split('T')[0]}T${report.meeting.time}.000Z`,
    );
    if (new Date() < meetingDateTime) {
      throw new BadRequestException('Meeting has not started yet');
    }

    // return report;
    const canLoggedInUserCreatOrEditAgendaReportReturn = {
      roleName: report?.roleName,
      status: report?.meeting?.status,
      meeting: allParticipants.map((i) => ({
        memberId: i?.id || null,
        memberName: i?.memberName,
        userId: i?.member?.userId || null,
        role: i?.roleName,
      })),
      report: null,
    };
    // console.log(canLoggedInUserCreatOrEditAgendaReportReturn);
    return canLoggedInUserCreatOrEditAgendaReportReturn;
  }
}
