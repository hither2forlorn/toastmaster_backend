import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { AgendaReportService } from './agenda-report.service';
import { CreateAgendaReportDto } from './dtos/agenda-report.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
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
    @Post(':meetingId')
    createAgendaReport(
        @Param('meetingId') meetingId: string,
        @Body() dto: CreateAgendaReportDto,
        @GetUser() user: any,
    ) {
        return this.agendaReportService.createAgendaReportGrammarian(meetingId, dto, user.id);
    }



    @ApiOperation({ summary: 'Get agenda report' })
    @ApiOkResponse({
        description: 'Agenda Report has been successfully extracted.',
    })
    @ApiBadRequestResponse({
        description: "You don't have access to get this report",
    })
    @Get(':agendaReportId')
    getAgendaReport(
        @Param('agendaReportId') agendaReportId: string,
        @GetUser() user: any,
    ) {
        return this.agendaReportService.getAgendaReportByAgendaReportId(agendaReportId);
    }






    @ApiOperation({ summary: 'Delete agenda report' })
    @ApiCreatedResponse({
        description: 'Agenda Report has been successfully deleted.',
    })
    @ApiBadRequestResponse({
        description: "You don't have access to delete report",
    })
    @Delete(':reportId')
    deleteAgendaReport(
        @Param('reportId') reportId: string,
        @GetUser() user: any,
    ) {
        return this.agendaReportService.deleteAgendaReport(user.id, reportId);
    }



    @ApiOperation({ summary: 'Delete agenda report of member' })
    @ApiCreatedResponse({
        description: 'Agenda Report of member has been successfully deleted.',
    })
    @ApiBadRequestResponse({
        description: "You don't have access to delete report",
    })
    @Patch(':memberId/:reportId')
    deleteAgendaReportByMemberId(
        @Param('memberId') memberId: string,
        @Param('reportId') reportId: string,
        @GetUser() user: any,
    ) {
        return this.agendaReportService.deleteAgendaReportByMemberId(user.id, memberId,reportId);
    }
}
