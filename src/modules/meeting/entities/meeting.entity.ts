import { BaseEntity } from 'src/common/entities/base.entity';
import { Club } from 'src/modules/club/entities/club.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { MEETING_STATUS } from '../enum/meeting-status.enum';
import { MEETING_TYPE } from '../enum/meeting-type.enum';
import { Agenda } from 'src/modules/agenda/entities/agenda.entity';

@Entity('meetings')
export class Meeting extends BaseEntity {
  @Column({ type: 'int', name: 'meeting_no' })
  meetingNo: number;

  @Column({ type: 'varchar', length: 255 })
  theme: string;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ type: 'time' })
  time: string;

  @Column({ type: 'varchar', length: 100 })
  venue: string;

  @Column({ type: 'varchar', nullable: true, length: 999 })
  notes: string | null;

  @Column({ type: 'simple-array', nullable: true, name: 'social_links' })
  socialLinks: string[] | null;

  @Column({ type: 'varchar', nullable: true, length: 255, name: 'word_of_the_day' })
  wordOfTheDay: string | null;

  @Column({ type: 'varchar', nullable: true, length: 255, name: 'idiom_of_the_day' })
  idiomOfTheDay: string | null;

  @Column({
    type: 'enum',
    enum: MEETING_STATUS,
    default: MEETING_STATUS.SCHEDULED,
  })
  status: MEETING_STATUS;

  @Column({
    name:"meeting_type",
    type: 'enum',
    enum: MEETING_TYPE,
    default: MEETING_TYPE.PHYSICAL,
  })
  meetingType: MEETING_TYPE;

  @Column({ name: 'club_id' })
  clubId: string;

  @ManyToOne(() => Club)
  @JoinColumn({ name: 'club_id' })
  club: Club;

  @OneToMany(() => Agenda, (agenda) => agenda.meeting, { cascade: true })
  agendas: Agenda[];
}
