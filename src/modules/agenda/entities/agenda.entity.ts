import { BaseEntity } from 'src/common/entities/base.entity';
import { ClubMember } from 'src/modules/club/entities/club-member.entity';
import { Meeting } from 'src/modules/meeting/entities/meeting.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

@Entity('agendas')
export class Agenda extends BaseEntity {
  @Column({ length: '99' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'role_name' })
  roleName: string;

  @Column({ type: 'int' })
  duration: number;

  @Column({ type: 'int' })
  sequence: number;

  @Column({ name: 'meeting_id' })
  meetingId: string;

  @Column({ name: 'member_id', nullable: true })
  memberId?: string;

  @Column({ name: 'member_name' })
  memberName: string;

  @Column({ name: 'is_guest' })
  isGuest: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => Meeting, (meeting) => meeting.agendas)
  @JoinColumn({ name: 'meeting_id' })
  meeting: Meeting;

  @OneToOne(() => ClubMember)
  @JoinColumn({ name: 'member_id' })
  member?: ClubMember;
}
