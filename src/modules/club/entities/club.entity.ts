import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ClubMeetingFrequency } from '../enum/club-meeting-frequency.enum';
import { ClubMeetingMode } from '../enum/club-meeting-mode.enum';
import { ClubMember } from './club-member.entity';
import { AgendaTemplate } from 'src/modules/agenda-template/entity/agenda-template.entity';

@Entity('clubs')
export class Club extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ length: 100, nullable: true })
  district: string;

  @Column({ length: 100, nullable: true })
  area: string;

  @Column({ length: 100, nullable: true })
  division: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({
    enum: ClubMeetingFrequency,
    default: ClubMeetingFrequency.WEEKLY,
    name: 'meeting_frequency',
  })
  meetingFrequency: ClubMeetingFrequency;

  @Column({
    enum: ClubMeetingMode,
    default: ClubMeetingMode.OFFLINE,
    name: 'meeting_mode',
  })
  meetingMode: ClubMeetingMode;

  @Column({ name: 'club_code', unique: true, length: 20, select: false })
  clubCode: string;

  @Column({ name: 'charter_date', type: 'date', nullable: true })
  charterDate: Date | null;

  @Column({ type: 'simple-array', nullable: true, name: 'social_links' })
  socialLinks: string[] | null;

  @OneToMany(() => ClubMember, (member) => member.club)
  members: ClubMember[];

  @OneToMany(() => AgendaTemplate, (template) => template.club, {
    cascade: true,
  })
  agendaTemplates: AgendaTemplate[];
}
