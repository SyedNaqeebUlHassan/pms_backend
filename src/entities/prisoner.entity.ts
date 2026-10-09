import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Punishment } from './punishment.entity';

export enum PrisonerSex {
  MALE = 'male',
  FEMALE = 'female',
}

@Entity('prisoners')
export class Prisoner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  prisoner_number: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'date' })
  dob: string;

  @Column({ type: 'enum', enum: PrisonerSex })
  sex: PrisonerSex;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'text' })
  crime: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, { nullable: false, eager: false })
  @JoinColumn({ name: 'created_by' })
  created_by: User;

  @OneToMany(() => Punishment, (punishment) => punishment.prisoner)
  punishments: Punishment[];
}
