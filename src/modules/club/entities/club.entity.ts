import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ClubMeetingFrequency } from '../enum/club-meeting-frequency.enum';
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

  @Column({ name: 'club_code', unique: true, length: 20, select: false })
  clubCode: string;

  @OneToMany(() => ClubMember, (member) => member.club)
  members: ClubMember[];

  @OneToMany(() => AgendaTemplate, (template) => template.club, {
    cascade: true,
  })
  agendaTemplates: AgendaTemplate[];
}
