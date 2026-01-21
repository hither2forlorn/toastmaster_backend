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
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { MeetingService } from './meeting.service';
import { CreateMeetingDto } from './dtos/create-meeting.dto';
import { UpdateMeetingDto } from './dtos/update-meeting.dto';
import { UpdateMeetingStatusDto } from './dtos/update-status.dto';
import { GetMeetingsByClubDto } from './dtos/get-meetings-by-club.dto';
import { MembershipGuard } from 'src/common/guards/membership.guard';
import { Roles } from 'src/common/decorators/role.decorator';
import { ClubRole } from '../club/enum/club-role.enum';
import { Public } from 'src/common/decorators/public.decorator';
import { AddMeetingNoteDto } from './dtos/add-note.dto';
import { UpcomingEventsDTO } from './dtos/get-upcoming-meeting.dto';
import { CreateMeetingWithTemplateDto } from './dtos/create-with-templete';

@ApiTags('Meetings')
@Controller('meetings')
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Public()
  @Get('upcoming')
  getUpcoming(@Query() query: UpcomingEventsDTO) {
    return this.meetingService.getUpcomingMeeting(
      query.page,
      query.limit,
      query.status,
      query.startDate,
      query.endDate,
    );
  }

  @Public()
  @Get('/select-agenda')
  @ApiOperation({ summary: 'Select agenda from pre-existing agenda' })
  @ApiQuery({
    name: 'page',
    // required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    // required: false,
    description: 'Items per page',
    example: 10,
  })
  async getAllMeetingToSelectIt(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    // console.log('from controller');
    return this.meetingService.getAllMeetingToSelectIt(page, limit);
  }

  @Public()
  @Get(':id')
  getMeetingById(@Param('id') id: string) {
    return this.meetingService.getMeetingById(id);
  }
  @Public()
  @Get('club/:clubId')
  getMeetingsByClub(
    @Param('clubId') clubId: string,
    @Query() query: GetMeetingsByClubDto,
  ) {
    return this.meetingService.getMeetingsByClub(
      clubId,
      query.page,
      query.limit,
      query.status,
      query.startDate,
      query.endDate,
    );
  }

  @ApiBearerAuth()
  @UseGuards(MembershipGuard)
  @Roles(ClubRole.OWNER, ClubRole.ADMIN)
  @Post()
  createMeeting(@Body() data: CreateMeetingDto) {
    return this.meetingService.createMeeting(data);
  }

  @ApiBearerAuth()
  @UseGuards(MembershipGuard)
  @Roles(ClubRole.OWNER, ClubRole.ADMIN)
  @Patch(':id')
  updateMeeting(@Param('id') id: string, @Body() data: UpdateMeetingDto) {
    return this.meetingService.updateMeeting(data, id);
  }

  @ApiBearerAuth()
  @UseGuards(MembershipGuard)
  @Roles(ClubRole.OWNER, ClubRole.ADMIN)
  @Patch(':id/status')
  updateMeetingStatus(
    @Param('id') id: string,
    @Body() body: UpdateMeetingStatusDto,
  ) {
    return this.meetingService.updateMeetingStatus(id, body.status);
  }

  @ApiBearerAuth()
  @UseGuards(MembershipGuard)
  @Roles(ClubRole.OWNER, ClubRole.ADMIN)
  @Patch(':id/notes')
  updateMeetingNotes(@Param('id') id: string, @Body() body: AddMeetingNoteDto) {
    return this.meetingService.updateNotes(id, body.notes);
  }

  @ApiBearerAuth()
  @UseGuards(MembershipGuard)
  @Roles(ClubRole.OWNER, ClubRole.ADMIN)
  @Delete(':id')
  deleteMeeting(@Param('id') id: string) {
    return this.meetingService.deleteMeeting(id);
  }

  @ApiBearerAuth()
  @UseGuards(MembershipGuard)
  @Roles(ClubRole.OWNER, ClubRole.ADMIN)
  @Post('create-with-templet')
  createMeetingWithTemplate(@Body() data: CreateMeetingWithTemplateDto) {
    return this.meetingService.createMeetingUsingTemplet(data);
  }
}
