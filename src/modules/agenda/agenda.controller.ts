import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { AgendaService } from './agenda.service';
import { CreateAgendaDto } from './dtos/create-agenda.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { MembershipGuard } from 'src/common/guards/membership.guard';
import { Roles } from 'src/common/decorators/role.decorator';
import { ClubRole } from '../club/enum/club-role.enum';
import { AssignRoleDto, ReorderAgendaDto } from './dtos/agenda.dto';

@ApiTags('Agenda')
@ApiBearerAuth()
@UseGuards(MembershipGuard)
@Roles(ClubRole.OWNER, ClubRole.ADMIN)
@Controller('agenda')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Post('/create')
  @ApiOperation({ summary: 'Create a new agenda item' })
  createAgenda(@Body() data: CreateAgendaDto) {
    return this.agendaService.createAgenda(data);
  }

  // Public routes
  @Public()
  @Get('/meeting/:meetingId')
  @ApiOperation({ summary: 'Get all agendas of a meeting' })
  @ApiParam({ name: 'meetingId', description: 'Meeting ID' })
  async getAllAgendasOfMeeting(@Param('meetingId') meetingId: string) {
    return this.agendaService.getAllAgendasOfMeeting(meetingId);
  }

  @Public()
  @Get('/:id')
  @ApiOperation({ summary: 'Get agenda by ID' })
  @ApiParam({ name: 'id', description: 'Agenda ID' })
  async getAgendaById(@Param('id') id: string) {
    return this.agendaService.getAgendaById(id);
  }

  @Roles(ClubRole.MEMBER)
  @Get('/meeting/:meetingId/stats')
  @ApiOperation({ summary: 'Get agenda statistics of a meeting' })
  @ApiParam({ name: 'meetingId', description: 'Meeting ID' })
  async getAgendaStatsOfMeeting(@Param('meetingId') meetingId: string) {
    return this.agendaService.getAgendaStatsOfMeeting(meetingId);
  }

  @Patch('/:id')
  @ApiOperation({ summary: 'Update an agenda item' })
  @ApiParam({ name: 'id', description: 'Agenda ID' })
  async updateAgenda(
    @Param('id') agendaId: string,
    @Body() data: Partial<CreateAgendaDto>,
  ) {
    return this.agendaService.updateAgenda(agendaId, data);
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete an agenda item' })
  @ApiParam({ name: 'id', description: 'Agenda ID' })
  async deleteAgenda(@Param('id') agendaId: string) {
    return this.agendaService.deleteAgenda(agendaId);
  }

  @Patch('/:id/assign-role')
  @ApiOperation({ summary: 'Assign role to an agenda item' })
  @ApiParam({ name: 'id', description: 'Agenda ID' })
  async assignRoleToAgenda(
    @Param('id') agendaId: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.agendaService.assignRoleToAgenda(agendaId, dto.roleName);
  }

  @Patch('/meeting/:meetingId/reorder')
  @ApiOperation({ summary: 'Update agenda sequence/order for a meeting' })
  @ApiParam({ name: 'meetingId', description: 'Meeting ID' })
  async updateSequenceOfAgendas(
    @Param('meetingId') meetingId: string,
    @Body() dto: ReorderAgendaDto,
  ) {
    return this.agendaService.updateSequenceOfAgendas(
      meetingId,
      dto.agendaOrder,
    );
  }
}
