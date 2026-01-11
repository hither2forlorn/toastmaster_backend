
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventsService } from './events.service';
import { CreateEventDto } from "../modules/events/dto/createEvent.dto"
import { UpdateEventDto } from "../modules/events/dto/updateEvent.dto"
import { multerConfig } from "../config/multer.config"

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // ================= CREATE =================
  @Post()
  @UseInterceptors(FileInterceptor('image', multerConfig))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateEventDto,
  ) {
    if (!file) {
      throw new BadRequestException('Image is required');
    }

    return this.eventsService.create({
      ...dto,
      image: `/uploads/events/${file.filename}`,
    });
  }

  // ================= FIND ALL =================
  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  // ================= FIND BY SLUG =================
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.eventsService.findOneBySlug(slug);
  }

  // ================= UPDATE BY SLUG =================
  @Patch(':slug')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  async update(
    @Param('slug') slug: string,
    @Body() dto: UpdateEventDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const updatePayload: UpdateEventDto = { ...dto };

    if (file) {
      updatePayload.image = `/uploads/events/${file.filename}`;
    }

    if (Object.keys(updatePayload).length === 0) {
      throw new BadRequestException('No update data provided');
    }

    return this.eventsService.updateBySlug(slug, updatePayload);
  }

  // ================= REMOVE BY SLUG =================
  @Delete(':slug')
  remove(@Param('slug') slug: string) {
    return this.eventsService.removeBySlug(slug);
  }
}