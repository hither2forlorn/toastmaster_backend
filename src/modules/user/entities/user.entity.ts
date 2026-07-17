import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import * as bcrypt from 'bcryptjs';
import { ClubMember } from 'src/modules/club/entities/club-member.entity';
import { Club } from 'src/modules/club/entities/club.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ length: 255, select: false })
  password: string;

  @Column({ length: 100, name: 'full_name' })
  fullName: string;

  @Column({ type: 'text', nullable: true })
  introduction?: string;

  @Column({ length: 20, name: 'member_id', nullable: true })
  memberId?: string;

  @Column({ length: 20, name: 'phone', nullable: true })
  phone?: string;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async comparePassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }

  @OneToMany(() => ClubMember, (membership) => membership.user)
  memberships: ClubMember[];

  @OneToMany(() => Club, (club) => club.owner)
  ownedClubs: Club[];
}
