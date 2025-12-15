import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClubService } from './club.service';
import { CreateClubDto } from './dtos/create-club.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UpdateClubDto } from './dtos/update-club-dto';
import { ClubMemberService } from './club-member.service';
import { AddToClubDto, JoinClubByCodeDto } from './dtos/club-join.dto';
import { MembershipGuard } from 'src/common/guards/membership.guard';
import { ClubRole } from './enum/club-role.enum';

@ApiBearerAuth()
@ApiTags('Club')
@Controller('club')
export class ClubController {
  constructor(
    private readonly clubService: ClubService,
    private readonly clubMemberService: ClubMemberService,
  ) {}
  @Post('/create')
  createClub(
    @Body() createClubDto: CreateClubDto,
    @GetUser('sub') userId: string,
  ) {
    return this.clubService.createClub(createClubDto, userId);
  }

  @Get('/myclubs')
  getUserClubs(@GetUser('sub') userId: string) {
    return this.clubService.getUserClubs(userId);
  }

  @Get('/:id')
  getClubInfo(@Param('id') clubId: string) {
    return this.clubService.getClubInfo(clubId);
  }

  @UseGuards(MembershipGuard)
  @Patch('/update/:id')
  updateClub(
    @Body() updateClubDto: UpdateClubDto,
    @Param('id') clubId: string,
    @GetUser('sub') userId: string,
    @Req() req,
  ) {
    if (req.clubRole !== ClubRole.OWNER && req.clubRole !== ClubRole.ADMIN) {
      throw new UnauthorizedException(
        'You are not authorized to update this club',
      );
    }
    return this.clubService.updateClub(updateClubDto, clubId, userId);
  }

  @UseGuards(MembershipGuard)
  @Delete('/delete/:id')
  deleteClub(
    @Param('id') clubId: string,
    @GetUser('sub') userId: string,
    @Req() req,
  ) {
    if (req.clubRole !== ClubRole.OWNER) {
      throw new UnauthorizedException(
        'You are not authorized to delete this club',
      );
    }
    return this.clubService.deleteClub(clubId, userId);
  }

  @Get('/all/list')
  //search filter: todo
  getAllClubs(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.clubService.getAllClubs(page, limit);
  }

  @UseGuards(MembershipGuard)
  @Get('/code')
  getJoinCode(@Query('clubId') clubId: string, @Req() req) {
    if (!clubId) {
      throw new UnauthorizedException('Club ID is required');
    }

    if (req.clubRole !== ClubRole.OWNER && req.clubRole !== ClubRole.ADMIN) {
      throw new UnauthorizedException(
        'You are not authorized to view the join code',
      );
    }

    return this.clubService.getJoinCode(clubId);
  }

  @UseGuards(MembershipGuard)
  @Post('/code/regenerate')
  regenerateJoinCode(@Body('clubId') clubId: string, @Req() req) {
    if (!clubId) {
      throw new UnauthorizedException('Club ID is required');
    }

    if (req.clubRole !== ClubRole.OWNER && req.clubRole !== ClubRole.ADMIN) {
      throw new UnauthorizedException(
        'You are not authorized to regenerate the join code',
      );
    }

    return this.clubService.changeClubCode(clubId);
  }

  @Get('/getbycode')
  getClubByCode(@Query('code') clubCode: string) {
    return this.clubService.findClubByCode(clubCode);
  }

  @Get('/:id/members')
  getClubMembers(@Param('id') clubId: string) {
    return this.clubMemberService.getClubMembers(clubId);
  }

  @Get('/member/:memberId')
  getMemberById(@Param('memberId') memberId: string) {
    return this.clubMemberService.getMemberById(memberId);
  }

  @Post('/join')
  joinClub(
    @Body() joinClubByCodeDto: JoinClubByCodeDto,
    @GetUser('sub') userId: string,
  ) {
    return this.clubMemberService.joinClubByCode(
      joinClubByCodeDto.clubCode,
      userId,
    );
  }

  @UseGuards(MembershipGuard)
  @Post('/:id/member/add')
  addMemberToClub(
    @Param('id') clubId: string,
    @Body() body: AddToClubDto,
    @Req() req,
  ) {
    if (req.clubRole !== ClubRole.OWNER && req.clubRole !== ClubRole.ADMIN) {
      throw new UnauthorizedException(
        'You are not authorized to add members to this club',
      );
    }
    return this.clubMemberService.addMemberToClub(clubId, body);
  }

  @UseGuards(MembershipGuard)
  @Delete('/member/remove/:memberId')
  removeMemberFromClub(@Param('memberId') memberId: string, @Req() req) {
    if (req.clubRole !== ClubRole.OWNER && req.clubRole !== ClubRole.ADMIN) {
      throw new UnauthorizedException(
        'You are not authorized to remove members from this club',
      );
    }
    return this.clubMemberService.removeMemberFromClub(memberId);
  }

  @Post('/member/role')
  getMemberRole(
    @Body('clubId') clubId: string,
    @Body('userId') userId: string,
  ) {
    return this.clubMemberService.getMemberRole(clubId, userId);
  }

  @UseGuards(MembershipGuard)
  @Patch('/member/role/update')
  updateMemberRole(
    @Body('memberId') memberId: string,
    @Body('newRole') newRole: ClubRole,
    @Body('clubId') clubId: string,
    @Req() req,
  ) {
    if (req.clubRole !== ClubRole.OWNER) {
      throw new UnauthorizedException(
        'You are not authorized to update member roles in this club',
      );
    }
    return this.clubMemberService.updateRole(memberId, newRole, clubId);
  }

  @Get('/stats')
  generateMemberStats(@Query('clubId') clubId: string) {
    return this.clubMemberService.generateMemberStats(clubId);
  }
}
