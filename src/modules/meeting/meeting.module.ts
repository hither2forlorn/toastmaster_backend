import { Module } from '@nestjs/common';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meeting } from './entities/meeting.entity';

@Module({
  controllers: [MeetingController],
  providers: [MeetingService],
  imports: [TypeOrmModule.forFeature([Meeting])],
  exports: [MeetingService],
})
export class MeetingModule {}
