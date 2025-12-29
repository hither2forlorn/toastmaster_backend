import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AgendaTemplate } from './agenda-template.entity';
import { AGENDA_ROLE } from '../enum/agenda-role.enum';

@Entity('agenda_items')
export class AgendaTemplateItem extends BaseEntity {
  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: AGENDA_ROLE,
    nullable: true,
    name: 'system_role',
  })
  systemRole?: AGENDA_ROLE;

  @Column({ type: 'text', nullable: true, name: 'custom_role' })
  customRole?: string;

  @Column()
  duration: number;

  @Column()
  sequence: number;

  @Column({ name: 'agenda_template_id', nullable: true })
  agendaTemplateId: string;

  @ManyToOne(() => AgendaTemplate, (template) => template.items)
  @JoinColumn({ name: 'agenda_template_id' })
  agendaTemplate: AgendaTemplate;
}
