import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum ActivityAction {
  CREATED = 'created',
  UPDATED = 'updated',
  LINKED = 'linked',
}

export enum ActivityEntityType {
  PRISONER = 'prisoner',
  GUARD = 'guard',
  FIR = 'fir',
}

@Entity('activity-logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ActivityAction })
  action: ActivityAction;

  @Column({ type: 'enum', enum: ActivityEntityType })
  entity_type: ActivityEntityType;

  @Column({ type: 'uuid' })
  entity_id: string;

  @Column({ type: 'varchar', length: 500 })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, { old: unknown; new: unknown }> | null;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, { nullable: false, eager: false })
  @JoinColumn({ name: 'created_by' })
  performed_by: User;
}
