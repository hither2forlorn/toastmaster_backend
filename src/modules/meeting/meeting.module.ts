import { Module } from '@nestjs/common';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meeting } from './entities/meeting.entity';
import { UserModule } from '../user/user.module';

@Module({
  controllers: [MeetingController],
  providers: [MeetingService],
  imports: [TypeOrmModule.forFeature([Meeting]), UserModule],
  exports: [MeetingService],
})
export class MeetingModule {}
