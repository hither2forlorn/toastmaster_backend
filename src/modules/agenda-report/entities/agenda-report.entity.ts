import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Agenda } from 'src/modules/agenda/entities/agenda.entity';

export enum ReportType {
  GRAMMARIAN = 'GRAMMARIAN',
  AH_COUNTER = 'AH_COUNTER',
}

@Entity('agenda_reports')
export class AgendaReport extends BaseEntity {
  @Column({ name: 'agenda_id' })
  agendaId: string;

  @Column({ type: 'enum', enum: ReportType, name: 'report_type' })
  reportType: ReportType;

  // Grammarian fields
  @Column({ length: 100, nullable: true, name: 'word_of_the_day' })
  wordOfTheDay?: string;

  @Column({ type: 'text', nullable: true, name: 'word_of_the_day_definition' })
  wordOfTheDayDefinition?: string;

  @Column({ type: 'text', nullable: true, name: 'grammar_notes' })
  grammarNotes?: string;

  // JSONB for member-specific evaluations
  @Column({ type: 'jsonb', nullable: true, name: 'member_evaluations' })
  memberEvaluations?: MemberEvaluation[];

  @Column({ type: 'jsonb', nullable: true, name: 'filler_word_counts' })
  fillerWordCounts?: FillerWordCount[];

  @Column({ type: 'text', nullable: true, name: 'overall_notes' })
  overallNotes?: string;

  @ManyToOne(() => Agenda, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agenda_id' })
  agenda: Agenda;
}

export interface MemberEvaluation {
  memberId: string | null;
  memberName: string;
  wordUsageCount?: number;
  examples?: string[];
  grammarIssues?: string;
}

export interface FillerWordCount {
  memberId: string;
  memberName: string;
  ahs?: number;
  ums?: number;
  likes?: number;
  other?: number;
  notes?: string;
}
