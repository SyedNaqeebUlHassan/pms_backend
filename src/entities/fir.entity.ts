import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Prisoner } from './prisoner.entity';
import { User } from './user.entity';

export enum FirStatus {
  REGISTERED = 'registered',
  CONVICTED = 'convicted',
  ACQUITTED = 'acquitted',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

@Entity('firs')
export class Fir {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Prisoner, (prisoner) => prisoner.firs, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  prisoner?: Prisoner | null;

  @Column({ type: 'varchar', length: 20, unique: true })
  complaint_number: string; // auto-generated: FIR-YYYY-NNNN

  @Column({ type: 'varchar', length: 255, nullable: true })
  accused_name?: string | null;

  @Column({ type: 'varchar', length: 255 })
  police_station: string;

  @Column({ type: 'timestamptz' })
  incident_date_time: Date;

  @Column({ type: 'varchar', length: 255 })
  offense_type: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: FirStatus, default: FirStatus.REGISTERED })
  status: FirStatus;

  @ManyToOne(() => User, { nullable: false, eager: false })
  @JoinColumn({ name: 'registered_by' })
  registered_by: User;

  @CreateDateColumn()
  registered_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
