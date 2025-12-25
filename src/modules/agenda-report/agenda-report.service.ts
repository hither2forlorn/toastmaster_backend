import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AgendaReport } from './entities/agenda-report.entity';
import { Repository } from 'typeorm';
import { ClubMemberService } from '../club/club-member.service';
import { ClubService } from '../club/club.service';
import { AgendaService } from '../agenda/agenda.service';
import { MeetingService } from '../meeting/meeting.service';
import { UserService } from '../user/user.service';
import { AgendaTemplateService } from '../agenda-template/agenda-template.service';
import { CreateAgendaReportDto } from './dtos/agenda-report.dto';

@Injectable()
export class AgendaReportService {
    constructor(
        @InjectRepository(AgendaReport) private readonly agendaReportRepo: Repository<AgendaReport>,
        // @InjectRepository(AgendaTemplateItem) private readonly agendaTempletItemRepo: Repository<AgendaTemplateItem>,
        private readonly agendaService: AgendaService,
        private readonly clubService: ClubService,
        private readonly clubMemberService: ClubMemberService,
        private readonly meetingService: MeetingService,
        private readonly userService: UserService,
        private readonly agendasTempletService: AgendaTemplateService
    ) { }

    async createAgendaReportGrammarian(meetingId, dto: CreateAgendaReportDto, userId): Promise<AgendaReport> {
        const agenda = await this.agendaService.getAgendaIdByMeetingIdWhereUserIsGrammarian(meetingId);
        // console.log(` UserId : ${userId}`)
        // console.log(agenda)
        if (!agenda) {
            throw new ForbiddenException('Not your agenda');
        }
        if (agenda?.userId !== userId) {
            throw new ForbiddenException('Not your agenda');
        }

        const reportRoles = ['Grammarian', 'Ah Counter'];
        if (!reportRoles.includes(agenda.roleName)) {
            throw new BadRequestException(`${agenda.roleName} role does not create reports`);
        }

        if (dto.reportType === 'GRAMMARIAN' && agenda.roleName !== 'Grammarian') {
            throw new BadRequestException('Report type must match your assigned role');
        }

        let report = await this.agendaReportRepo.findOne({
            where: { agendaId: agenda?.agendaId }
        });
        console.log(report)

        if (report) {
            if (!dto.memberEvaluations || dto.memberEvaluations.length === 0) {
                throw new BadRequestException('Member evaluations are required');
            }
            if (!report.memberEvaluations) {
                report.memberEvaluations = [];
            }

            report.memberEvaluations.push(dto.memberEvaluations[0]);
            return await this.agendaReportRepo.save(report);
        } else {
            report = this.agendaReportRepo.create({
                agendaId: agenda.agendaId,
                ...dto
            });
            return await this.agendaReportRepo.save(report);
        }
    }

    async getAgendaReportByAgendaReportId(agendaReportId) {
        const agendaReport = await this.agendaReportRepo.findOne({ where: { id: agendaReportId } })
        if (!agendaReport) {
            throw new BadRequestException("Agenda Report doesn't exist for this agenda report id");
        }
        return agendaReport
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

    async deleteAgendaReportByMemberId(userId, meetingId, reportId): Promise<AgendaReport> {
        const agenda = await this.agendaService.getAgendaIdByMeetingIdWhereUserIsGrammarian(
            meetingId,
            true
        );

        if (!agenda) {
            throw new NotFoundException('No Grammarian agenda found for this meeting');
        }
        if (agenda?.userId !== userId) {
            throw new ForbiddenException('Not your agenda');
        }

        const report = await this.agendaReportRepo.findOne({
            where: { agendaId: agenda.agendaId }
        });

        if (!report) {
            throw new NotFoundException('No report exists for this agenda');
        }
        if (report.id !== reportId) {
            throw new BadRequestException('Report ID mismatch');
        }

        if (report.memberEvaluations && report.memberEvaluations.length > 0) {
            report.memberEvaluations = report.memberEvaluations.filter(
                evaluation => evaluation.memberId !== agenda.memberId
            );

            return await this.agendaReportRepo.save(report);
        }
        throw new NotFoundException('No member evaluations exist in this report');
    }
}
