import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { AgendaReportService } from './agenda-report.service';
import { CreateAgendaReportDto } from './dtos/agenda-report.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { MembershipGuard } from 'src/common/guards/membership.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('agenda-report')
@ApiBearerAuth()
@ApiTags('Agenda-Report')
@UseGuards(JwtAuthGuard)
export class AgendaReportController {
    constructor(private agendaReportService: AgendaReportService) { }

    @ApiOperation({ summary: 'Grammerian and ah-report create' })
    @ApiCreatedResponse({
        description: 'Agenda Report has been successfully created.',
    })
    @ApiBadRequestResponse({
        description: "You don't have access to create report",
    })
    @Post(':agendaId')
    createAgendaReport(
        @Param('agendaId') agendaId: string,
        @Body() dto:CreateAgendaReportDto,
         @GetUser() user: any,
    ) {
        return this.agendaReportService.createAgendaReportGrammarian(agendaId,dto,user.id);
    }
}
