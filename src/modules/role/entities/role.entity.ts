import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';


@Entity('roles')
export class Role extends BaseEntity {
  @Column({ type: 'varchar'})
  type: string;
}
