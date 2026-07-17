import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Meeting } from 'src/modules/meeting/entities/meeting.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  Unique,
} from 'typeorm';

@Entity('agendas')
@Unique(['meetingId', 'sequence'])
export class Agenda extends BaseEntity {
  @Column({ length: 255 })
  title: string;

  // @Column({ type: 'date' })
  // date: Date;

  @Column({ name: 'role_name', nullable: true, type: 'varchar' })
  roleName: string | null;

  @Column({ name: 'role_id', nullable: true, type: 'uuid' })
  roleId?: string;

  @Column({ type: 'int' })
  duration: number;

  @Column({ type: 'int' })
  sequence: number;

  @Column({ name: 'meeting_id' })
  meetingId: string;

  @Column({ name: 'member_id', nullable: true })
  memberId?: string;

  @Column({ name: 'member_name', type: 'varchar', nullable: true })
  memberName: string | null;

  @Column({ name: 'is_guest' })
  isGuest: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => Meeting, (meeting) => meeting.agendas)
  @JoinColumn({ name: 'meeting_id' })
  meeting: Meeting;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'member_id' })
  member?: User;
}
