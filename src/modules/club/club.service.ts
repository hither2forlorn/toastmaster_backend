import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Club } from './entities/club.entity';
import { Repository } from 'typeorm';
import { CreateClubDto } from './dtos/create-club.dto';
import { UpdateClubDto } from './dtos/update-club-dto';
import { ClubMemberService } from './club-member.service';
import { CodeGeneratorService } from 'src/common/utils/code-generator.service';

@Injectable()
export class ClubService {
  constructor(
    @InjectRepository(Club) private readonly clubRepo: Repository<Club>,
    private readonly clubMemberService: ClubMemberService,
    private readonly codeGenerator: CodeGeneratorService,
  ) {}

  async createClub(data: CreateClubDto, userId: string): Promise<Club> {
    const clubCode = await this.codeGenerator.generateUnique(
      data.name,
      async (code: string) => {
        const existingClub = await this.clubRepo.findOne({
          where: { clubCode: code },
        });
        return !existingClub;
      },
    );

    if (!clubCode) {
      throw new InternalServerErrorException('Failed to generate club code');
    }

    const newClub = this.clubRepo.create({
      ...data,
      clubCode,
      ownerId: userId,
    });

    if (!newClub) {
      throw new InternalServerErrorException('Failed to create club');
    }

    await this.clubRepo.save(newClub);
    await this.clubMemberService.addMemberToClub(newClub.id, { userId });
    return newClub;
  }

  async getClubInfo(clubId: string): Promise<Club> {
    const club = await this.clubRepo.findOne({
      where: { id: clubId },
      relations: ['owner'],
      select: [
        'id',
        'name',
        'description',
        'district',
        'area',
        'division',
        'ownerId',
        'clubCode',
        'charterDate',
        'socialLinks',
      ],
    });
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    return club;
  }

  async updateClub(data: UpdateClubDto, clubId: string): Promise<Club> {
    const club = await this.clubRepo.findOne({
      where: { id: clubId },
      relations: ['owner'],
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    const updateResult = await this.clubRepo.update(clubId, data);

    if (updateResult.affected === 0) {
      throw new InternalServerErrorException('Failed to update club');
    }

    return this.getClubInfo(clubId);
  }

  async deleteClub(
    clubId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const club = await this.clubRepo.findOne({
      where: { id: clubId },
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    const deleteResult = await this.clubRepo.delete(clubId);

    if (deleteResult.affected === 0) {
      throw new InternalServerErrorException('Failed to delete club');
    }

    return { message: 'Club deleted successfully' };
  }

  async getAllClubs(
    page: number,
    limit: number,
    filters?: { district?: string; area?: string; division?: string },
  ): Promise<Club[]> {
    const where: Record<string, string> = {};
    if (filters?.district) {
      where.district = filters.district;
    }
    if (filters?.area) {
      where.area = filters.area;
    }
    if (filters?.division) {
      where.division = filters.division;
    }

    const clubs = await this.clubRepo.find({
      where,
      skip: (page - 1) * limit,
      take: limit,
      relations: ['owner'],
    });

    return clubs;
  }

  // this may not be handled by club controller, it has not been implemented yet
  async getUserClubs(userId: string): Promise<Club[]> {
    const clubs = await this.clubRepo.find({
      where: { ownerId: userId },
      relations: ['owner'],
      order: { createdAt: 'DESC' },
    });

    if (!clubs) {
      throw new NotFoundException('No clubs found for this user');
    }

    return clubs;
  }

  async getJoinCode(clubId: string) {
    console.log(clubId);
    const club = await this.clubRepo.findOne({
      where: {
        id: clubId,
      },
      select: ['clubCode'],
    });
    return { code: club!.clubCode };
  }

  async changeClubCode(clubId: string): Promise<{ code: string }> {
    const club = await this.clubRepo.findOne({
      where: { id: clubId },
      select: ['clubCode', 'name'],
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    const newCode = await this.codeGenerator.generateUnique(
      club.name,
      async (code) => {
        const existingClub = await this.clubRepo.findOne({
          where: { clubCode: code },
        });
        return !existingClub;
      },
    );

    await this.clubRepo.update(clubId, { clubCode: newCode });

    return { code: newCode };
  }

  async findClubByCode(clubCode: string): Promise<Club> {
    const club = await this.clubRepo.findOne({
      where: { clubCode },
      select: ['id', 'name', 'description', 'district', 'area', 'division'],
    });

    if (!club) {
      throw new NotFoundException('Club not found with the provided code');
    }

    return club;
  }
}
