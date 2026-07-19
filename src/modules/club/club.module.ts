import { Module } from '@nestjs/common';
import { ClubService } from './club.service';
import { ClubController } from './club.controller';
import { ClubMember } from './entities/club-member.entity';
import { Club } from './entities/club.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClubMemberService } from './club-member.service';
import { UserModule } from '../user/user.module';
import { User } from '../user/entities/user.entity';
import { RoleModule } from '../role/role.module';
import { CodeGeneratorService } from 'src/common/utils/code-generator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Club, ClubMember, User]),
    UserModule,
    RoleModule,
  ],
  providers: [ClubService, ClubMemberService, CodeGeneratorService],
  controllers: [ClubController],
  exports: [ClubService, ClubMemberService],
})
export class ClubModule {}
