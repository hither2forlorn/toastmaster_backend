import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
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

    async createAgendaReportGrammarian(agendaId, dto: CreateAgendaReportDto, userId): Promise<AgendaReport> {
        const agenda = await this.agendaService.findAgendaWithMember(agendaId);
        // console.log(`AgendaId :${agendaId}, UserId : ${userId}`)
        // console.log(agenda)
        if (agenda?.member?.userId !== userId) {
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
            where: { agendaId }
        });

        if (report) {
            Object.assign(report, dto);
            return await this.agendaReportRepo.save(report);
        } else {
            report = this.agendaReportRepo.create({
                agendaId,
                ...dto
            });
            return await this.agendaReportRepo.save(report);
        }
    }
}
