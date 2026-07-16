import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
} from './dtos/user.dto';
import { MembershipStatus } from '../club/enum/club-members.enum';

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

  async findOrCreateByEmail(fullName: string, email: string): Promise<User> {
    const existing = await this.userRepo.findOneBy({ email });
    if (existing) return existing;

    const user = this.userRepo.create({
      fullName,
      email,
      password: 'Password123',
    });
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
      .leftJoin(
        'user.memberships',
        'membership',
        'membership.status = :status',
        { status: MembershipStatus.ACTIVE },
      )
      .leftJoin('membership.club', 'club')
      .leftJoin('membership.role', 'role')
      .leftJoin('user.ownedClubs', 'ownedClub')
      .select([
        'user.id',
        'user.email',
        'user.fullName',
        'user.introduction',
        'user.memberId',
        `COALESCE(
          JSONB_AGG(
            DISTINCT CASE WHEN "club"."id" IS NOT NULL
              THEN JSONB_BUILD_OBJECT(
                'id', "club"."id",
                'name', "club"."name"
              )
            END
          ) FILTER (WHERE "club"."id" IS NOT NULL), '[]'
        ) AS member_of`,
        `COALESCE(
          JSONB_AGG(
            DISTINCT CASE WHEN "club"."id" IS NOT NULL AND ("role"."is_admin" = true OR "club"."owner_id" = "user"."id")
              THEN JSONB_BUILD_OBJECT(
                'id', "club"."id",
                'name', "club"."name"
              )
            END
          ) FILTER (WHERE "club"."id" IS NOT NULL AND ("role"."is_admin" = true OR "club"."owner_id" = "user"."id")), '[]'
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
    const user = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect(
        'user.memberships',
        'memberships',
        'memberships.status = :status',
        { status: MembershipStatus.ACTIVE },
      )
      .leftJoinAndSelect('memberships.club', 'club')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user.memberships.map((membership) => membership.club);
  }

  // update profile details for given user id
  async updateProfile(userId: string, data: UpdateUserDto) {
    const user = await this.getUserById(userId);

    if (data.email && data.email !== user.email) {
      const existing = await this.userRepo.findOneBy({ email: data.email });
      if (existing && existing.id !== userId) {
        throw new BadRequestException('Email already in use');
      }
    }

    Object.assign(user, data);
    return this.userRepo.save(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: userId })
      .getOne();
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const match = await user.comparePassword(dto.currentPassword);
    if (!match) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.password = dto.newPassword;
    return this.userRepo.save(user);
  }
}
