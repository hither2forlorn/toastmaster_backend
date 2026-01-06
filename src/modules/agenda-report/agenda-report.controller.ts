import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AgendaReportService } from './agenda-report.service';
import { CreateAgendaReportDto } from './dtos/agenda-report.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@Controller('agenda-report')
@ApiBearerAuth()
@ApiTags('Agenda-Report')
export class AgendaReportController {
  constructor(private agendaReportService: AgendaReportService) {}

  // edit report of specific user
  @ApiOperation({ summary: 'Edit agenda report of member' })
  @ApiCreatedResponse({
    description: 'Agenda Report of member has been successfully edited.',
  })
  @ApiBadRequestResponse({
    description: "You don't have access to edit this report",
  })
  @ApiQuery({
    name: 'memberId',
    required: false,
    type: String,
    description: 'Optional member ID to filter the report edit',
  })
  @Patch('edit/:reportId')
  editAgendaReportByMemberId(
    @Param('reportId') reportId: string,
    @GetUser() user: any,
    @Body() dto: CreateAgendaReportDto,
    @Query('memberId') memberId?: string,
  ) {
    console.log(user)
    return this.agendaReportService.editAgendaReportOfMemberByMemberId(
      user?.id,
      reportId,
      dto,
      memberId,
    );
  }

  // create
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
    return this.agendaReportService.createAgendaReportGrammarian(
      meetingId,
      dto,
      user?.sub,
    );
  }

  // get by reportId
  @ApiOperation({ summary: 'Get agenda report' })
  @ApiOkResponse({
    description: 'Agenda Report has been successfully extracted.',
  })
  @ApiBadRequestResponse({
    description: "You don't have access to get this report",
  })
  @Get(':reportId')
  getAgendaReport(@Param('reportId') reportId: string, @GetUser() user: any) {
    return this.agendaReportService.getAgendaReportByAgendaReportId(reportId);
  }

  // get report of loggedin user
  @ApiOperation({ summary: 'Get agenda report of logged in user' })
  @ApiOkResponse({
    description: 'Agenda Report has been successfully extracted.',
  })
  @ApiBadRequestResponse({
    description: "You don't have access to get this report",
  })
  @Get(':reportId')
  getAgendaRepor(@Param('reportId') reportId: string, @GetUser() user: any) {
    return this.agendaReportService.getAgendaReportByAgendaReportId(reportId);
  }

  // get report of loggedin user
  @ApiOperation({ summary: 'Get agenda report of logged in user' })
  @ApiOkResponse({
    description: 'Agenda Report has been successfully extracted.',
  })
  @ApiBadRequestResponse({
    description: "You don't have access to get this report",
  })
  @Get()
  getAgendaReportOfUser(@GetUser() user: any) {
    // console.log(user)
    return this.agendaReportService.getAgendaReportByMemberId(user?.sub);
  }

  // delete report by reportId
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
    return this.agendaReportService.deleteAgendaReport(user?.sub, reportId);
  }

  // delete report of specific user
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
    return this.agendaReportService.deleteAgendaReportByMemberId(
      user?.sub,
      memberId,
      reportId,
    );
  }
}
