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

export enum GuardSex {
  MALE = 'male',
  FEMALE = 'female',
}

@Entity('guards')
export class Guard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  employee_no: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'date' })
  dob: Date;

  @Column({ type: 'enum', enum: GuardSex })
  sex: GuardSex;

  @Column({ type: 'decimal', precision: 4, scale: 1 })
  duty_hours: number;

  @Column({ type: 'time' })
  shift_start: string;

  @Column({ type: 'time' })
  shift_end: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => User, { nullable: false, eager: false })
  @JoinColumn({ name: 'created_by' })
  created_by: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
