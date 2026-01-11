import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import slugify from 'slugify';
import { randomBytes } from 'crypto';
import { EventMode } from "../dto/eventMode.enum"

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  overview: string;

  @Column({ nullable: true })
  image: string;

  @Column()
  venue: string;

  @Column()
  location: string;

  @Column({ type: 'date', nullable: true })
  date?: string;

  @Column()
  time: string;

  @Column({
    type: 'enum',
    enum: EventMode,
    default: EventMode.OFFLINE,
  })
  mode: EventMode;

  @Column()
  audience: string;

  @Column("text", { array: true, default: [] })
  agenda: string[];

  @Column()
  organizer: string;

  @Column("text", { array: true, default: [] })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateSlug() {
    const baseSlug = slugify(this.title, { lower: true, strict: true });
    const uniqueSuffix = randomBytes(3).toString('hex');
    this.slug = `${baseSlug}-${uniqueSuffix}`;
  }
}