import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { RoleCategory } from '../enum/role-category.enum';

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  key: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ name: 'is_admin', type: 'boolean', default: false })
  isAdmin: boolean;

  @Column({ type: 'varchar', default: RoleCategory.CLUB_MEMBER })
  category: RoleCategory;
}
