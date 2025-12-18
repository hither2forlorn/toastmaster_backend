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
import {
  GetMemberRoleDto,
  UpdateMemberRoleDto,
} from './dtos/member-related.dto';
import { Roles } from 'src/common/decorators/role.decorator';

@ApiBearerAuth()
@ApiTags('Clubs')
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

  @Get('/all/list')
  getAllClubs(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.clubService.getAllClubs(page, limit);
  }

  @UseGuards(MembershipGuard)
  @Roles(ClubRole.OWNER, ClubRole.ADMIN)
  @Get('/code')
  getJoinCode(@Query('clubId') clubId: string, @Req() req) {
    console.log('this is clubId', clubId);
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
  regenerateJoinCode(@Query('clubId') clubId: string, @Req() req) {
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

  @Get('/stats')
  generateMemberStats(@Query('clubId') clubId: string) {
    return this.clubMemberService.generateMemberStats(clubId);
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

  @Get('/member/role')
  getMemberRole(
    @Query('clubId') clubId: string,
    @Query('userId') userId: string,
  ) {
    if (!clubId || !userId) {
      throw new UnauthorizedException(
        'clubId and userId are required in the request body',
      );
    }
    return this.clubMemberService.getMemberRole(clubId, userId);
  }

  @UseGuards(MembershipGuard)
  @Patch('/member/role/update')
  updateMemberRole(
    @Body() { memberId, clubId, newRole }: UpdateMemberRoleDto,
    @Req() req,
  ) {
    if (req.clubRole !== ClubRole.OWNER) {
      throw new UnauthorizedException(
        'You are not authorized to update member roles in this club',
      );
    }
    return this.clubMemberService.updateRole(memberId, newRole, clubId);
  }

  @UseGuards(MembershipGuard)
  @Patch('/update/:clubId')
  updateClub(
    @Body() updateClubDto: UpdateClubDto,
    @Param('clubId') clubId: string,
    @Req() req,
  ) {
    if (req.clubRole !== ClubRole.OWNER && req.clubRole !== ClubRole.ADMIN) {
      throw new UnauthorizedException(
        'You are not authorized to update this club',
      );
    }
    return this.clubService.updateClub(updateClubDto, clubId);
  }

  @UseGuards(MembershipGuard)
  @Delete('/delete/:clubId')
  deleteClub(
    @Param('clubId') clubId: string,
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

  @Get('/:clubId/members')
  getClubMembers(@Param('clubId') clubId: string) {
    return this.clubMemberService.getClubMembers(clubId);
  }

  @UseGuards(MembershipGuard)
  @Post('/:clubId/member/add')
  addMemberToClub(
    @Param('clubId') clubId: string,
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
  @Delete('/:clubId/member/remove/:memberId')
  removeMemberFromClub(
    @Param('clubId') clubId: string,
    @Param('memberId') memberId: string,
    @Req() req,
  ) {
    if (req.clubRole !== ClubRole.OWNER && req.clubRole !== ClubRole.ADMIN) {
      throw new UnauthorizedException(
        'You are not authorized to remove members from this club',
      );
    }
    return this.clubMemberService.removeMemberFromClub(memberId, clubId);
  }

  @Get('/member/:memberId')
  getMemberById(@Param('memberId') memberId: string) {
    return this.clubMemberService.getMemberById(memberId);
  }

  @Get('/:clubId')
  getClubInfo(@Param('clubId') clubId: string) {
    return this.clubService.getClubInfo(clubId);
  }
}
