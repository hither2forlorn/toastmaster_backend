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
        const agendas = await this.agendaService.getAgendaIdByMeetingId(meetingId);
        if (!agendas || agendas.length === 0) {
            throw new ForbiddenException('No agenda found');
        }

        const userIds = agendas.map(a => a.userId);
        if (!userIds.includes(userId)) {
            throw new ForbiddenException('Not your agenda');
        }

        const roleNames = agendas.map(a => a.roleName.toUpperCase().replace(' ', '_'));
        if (!roleNames.includes(dto?.reportType.toString())) {
            throw new BadRequestException(`${dto?.reportType} role does not create reports`);
        }

        const agenda = agendas.find(a => a.userId === userId);
        if (!agenda) {
            throw new ForbiddenException('Not your agenda');
        }

        if (
            (dto.reportType === 'GRAMMARIAN' && agenda.roleName !== 'Grammarian') ||
            (dto.reportType === 'AH_COUNTER' && agenda.roleName !== 'Ah Counter')
        ) {
            throw new BadRequestException('Report type must match your assigned role');
        }

        let report = await this.agendaReportRepo.findOne({
            where: { agendaId: agenda.agendaId }
        });

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
            throw new BadRequestException("Agenda Report creation fail");
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

    async getAgendaReportByMemberId(memberId: string) {
        const agendaReport = await this.agendaReportRepo
            .query(`
                        SELECT
                        ar.id as report_id,
                        ar.report_type,
                        evaluation->>'memberId' as evaluated_member_id,
                        evaluation->>'memberName' as evaluated_member_name,
                        evaluation->>'grammarIssues' as grammar_issues,
                        evaluation->'examples' as usage_examples,
                        evaluation->>'wordUsageCount' as word_usage_count
                        FROM agenda_reports ar
                        left JOIN LATERAL jsonb_array_elements(ar.filler_word_counts) as filler on true
                        left JOIN LATERAL jsonb_array_elements(ar.member_evaluations ) as evaluation on true
                        WHERE evaluation->>'memberId' = $1 or filler->>'memberId' = $1
                    `, [memberId]
            );

        console.log(memberId)
        console.log(agendaReport)
        if (agendaReport.length === 0) {
            throw new NotFoundException("No agenda reports found for this member");
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
        reportId: string
    ): Promise<AgendaReport> {
        const report = await this.agendaReportRepo
            .findOne({
                where: { id: reportId },
                relations: ['agenda', 'agenda.member']
            });
        // console.log(report)
        if (!report) {
            throw new NotFoundException("No agenda report found with given report id");
        }
        if (report.agenda.member?.userId !== userId) {
            throw new ForbiddenException("You cannot modify this resource");
        }

        if (report.memberEvaluations && report.memberEvaluations.length > 0) {
            if (!report.memberEvaluations) {
                report.memberEvaluations = [];
            }
            report.memberEvaluations = report.memberEvaluations.filter(
                evaluation => evaluation.memberId !== memberId
            );

            return await this.agendaReportRepo.save(report);
        }
        if (report.fillerWordCounts && report.fillerWordCounts.length > 0) {
            if (!report.fillerWordCounts) {
                report.fillerWordCounts = [];
            }
            report.fillerWordCounts.filter(
                count => count.memberId !== memberId
            );
            return await this.agendaReportRepo.save(report);
        }
        throw new NotFoundException('No evaluation found for this member in the report');
    }

    async editAgendaReportOfMemberByMemberId(
        userId: string,
        reportId: string,
        dto: CreateAgendaReportDto,
        memberId?: string
    ): Promise<AgendaReport> {
        const report = await this.agendaReportRepo.findOne({
            where: { id: reportId },
            relations: ['agenda', 'agenda.member']
        });

        if (!report) {
            throw new NotFoundException("No agenda report found with given report id");
        }

        if (report.agenda.member?.userId !== userId) {
            throw new ForbiddenException("You cannot modify this resource");
        }

        let hasChanges = false;

        if (dto.memberEvaluations && dto.memberEvaluations.length > 0) {
            if (!report.memberEvaluations) {
                report.memberEvaluations = [];
            }
            report.memberEvaluations = report.memberEvaluations.filter(
                evaluation => evaluation.memberId !== memberId
            );
            report.memberEvaluations.push(dto.memberEvaluations[0]);
            hasChanges = true;
        }

        if (dto.fillerWordCounts && dto.fillerWordCounts.length > 0) {
            if (!report.fillerWordCounts) {
                report.fillerWordCounts = [];
            }
            report.fillerWordCounts = report.fillerWordCounts.filter(
                count => count.memberId !== memberId
            );
            report.fillerWordCounts.push(dto.fillerWordCounts[0]);
            hasChanges = true;
        }

        const generalFields = ['wordOfTheDay', 'wordOfTheDayDefinition', 'grammarNotes', 'overallNotes'];
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
}
