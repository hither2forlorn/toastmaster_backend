import { BaseEntity } from 'src/common/entities/base.entity';
import { Club } from 'src/modules/club/entities/club.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { AgendaTemplateItem } from './agenda-item.entity';

@Entity('agenda_templates')
export class AgendaTemplate extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  clubId?: string;

  @Column()
  isDefault: boolean;

  @ManyToOne(() => Club, (club) => club.agendaTemplates, { nullable: true })
  club?: Club;

  @OneToMany(() => AgendaTemplateItem, (item) => item.agendaTemplate, {
    cascade: true,
  })
  items: AgendaTemplateItem[];
}
