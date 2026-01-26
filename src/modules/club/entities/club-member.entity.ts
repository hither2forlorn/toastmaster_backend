import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Club } from './club.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { ClubRole } from '../enum/club-role.enum';
import { MembershipStatus } from '../enum/club-members.enum';

@Entity()
@Unique(['clubId', 'memberEmail'])
@Unique(['clubId', 'userId'])
export class ClubMember extends BaseEntity {
  @Column({ nullable: true, name: 'user_id' })
  userId: string | null;

  @Column({ name: 'club_id' })
  clubId: string;

  @Column({ length: 100, name: 'member_name' })
  memberName: string;

  @Column({ length: 100, name: 'member_email' })
  memberEmail: string;

  @Column({
    name: 'date_joined',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  dateJoined: Date;

  @Column({
    type: 'enum',
    enum: MembershipStatus,
  })
  status: MembershipStatus;

  @ManyToOne(() => Club, (club) => club.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'club_id' })
  club: Club;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ default: ClubRole.MEMBER, enum: ClubRole, type: 'enum' })
  role: ClubRole;
}
