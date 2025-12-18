import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dtos/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async registerUser(data: CreateUserDto): Promise<User> {
    const duplicateUser = await this.userRepo.findOneBy({ email: data.email });
    if (duplicateUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const user = this.userRepo.create({ ...data });
    return this.userRepo.save(user);
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async getProfile(userId: string) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .leftJoin('user.memberships', 'membership')
      .leftJoin('membership.club', 'club')
      .leftJoin('user.ownedClubs', 'ownedClub')
      .select([
        'user.id',
        'user.email',
        'user.fullName',
        `COALESCE(
          JSONB_AGG(
            DISTINCT CASE WHEN "membership"."role" = 'MEMBER' AND "club"."id" IS NOT NULL
              THEN JSONB_BUILD_OBJECT(
                'id', "club"."id",
                'name', "club"."name"
              )
            END
          ) FILTER (WHERE "membership"."role" = 'MEMBER' AND "club"."id" IS NOT NULL), '[]'
        ) AS member_of`,
        `COALESCE(
          JSONB_AGG(
            DISTINCT CASE WHEN "membership"."role" = 'ADMIN' AND "club"."id" IS NOT NULL
              THEN JSONB_BUILD_OBJECT(
                'id', "club"."id",
                'name', "club"."name"
              )
            END
          ) FILTER (WHERE "membership"."role" = 'ADMIN' AND "club"."id" IS NOT NULL), '[]'
        ) AS admin_of`,
        `COALESCE(
          JSONB_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', "ownedClub"."id",
              'name', "ownedClub"."name",
              'clubCode', "ownedClub"."club_code"
            )
          ) FILTER (WHERE "ownedClub"."id" IS NOT NULL), '[]'
        ) AS owned_clubs`,
      ])
      .where('user.id = :userId', { userId })
      .groupBy('user.id')
      .getRawOne();

    return user
      ? JSON.parse(JSON.stringify(user))
      : { member_of: [], admin_of: [], owned_clubs: [] };
  }

  async getUserClubs(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['memberships', 'memberships.club', 'ownedClubs'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Collect all clubs the user owns or is a member of
    const memberClubs = user.memberships.map((membership) => membership.club);
    const ownedClubs = user.ownedClubs;

    // Combine and deduplicate by club id
    const allClubsMap = new Map<string, any>();
    [...ownedClubs, ...memberClubs].forEach((club) => {
      allClubsMap.set(club.id, club);
    });

    return Array.from(allClubsMap.values());
  }
}
