import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from "../modules/events/entities/event.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),  // 👈 this creates EventRepository
  ],
  providers: [EventsService],
  controllers: [EventsController],
})
export class EventsModule {}
