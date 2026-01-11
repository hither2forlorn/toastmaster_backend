import { IsString, IsEnum, IsArray, IsDateString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { EventMode } from "./eventMode.enum";

export class CreateEventDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  overview: string;

  @IsString()
  image: string;

  @IsString()
  venue: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value === '' ? undefined : value)) // empty string → undefined
  date?: string;

  @IsString()
  time: string;

  @Transform(({ value }) => value?.toLowerCase())
  @IsEnum(EventMode)
  mode: EventMode;

  @IsString()
  audience: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((i) => i.trim()) : value ?? []
  )
  @IsArray()
  agenda: string[];

  @IsString()
  organizer: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((i) => i.trim()) : value ?? []
  )
  @IsArray()
  tags: string[];
}