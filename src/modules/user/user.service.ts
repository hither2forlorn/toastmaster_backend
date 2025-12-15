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
          JSON_AGG(
            DISTINCT CASE WHEN  membership.role = 'MEMBER'
              THEN JSON_BUILD_OBJECT(
                'id', club.id,
                'name', club.name
              )
            END
            ), '[]'
        ) AS member_of`,
        `COALESCE(
          JSON_AGG(
            DISTINCT CASE WHEN membership.role = 'ADMIN'
              THEN JSON_BUILD_OBJECT(
                'id', club.id,
                'name', club.name
                )
              END
              ), '[]'
        ) AS admin_of`,
        `COALESCE(
          JSON_AGG(
            DISTINCT JSON_BUILD_OBJECT(
              'id', ownedClub.id,
              'name', ownedClub.name,
              'clubCode', ownedClub.clubCode
            )
          ), '[]'
        ) AS owner_of`,
      ])
      .where('user.id = :userId', { userId })
      .groupBy('user.id')
      .getRawOne();

    return JSON.parse(JSON.stringify(user));
  }
}
