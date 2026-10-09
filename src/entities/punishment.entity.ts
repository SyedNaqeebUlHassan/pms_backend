import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Prisoner } from './prisoner.entity';

export enum PunishmentStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('punishments')
export class Punishment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, eager: false })
  @JoinColumn({ name: 'assigned_by' })
  assigned_by: User;

  @ManyToOne(() => Prisoner, (prisoner) => prisoner.punishments, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  prisoner: Prisoner;

  @Column({ type: 'date', nullable: false })
  start_date: Date;

  @Column({ type: 'date', nullable: false })
  end_date: Date;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', nullable: true, default: null })
  remarks: string | null;

  @Column({ type: 'enum', enum: PunishmentStatus })
  status: PunishmentStatus;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  completed_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
