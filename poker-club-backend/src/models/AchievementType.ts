import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { AchievementInstance } from './AchievementInstance';

export enum AchievementCode {
  FIRST_TOURNAMENT = 'FIRST_TOURNAMENT',
  FIVE_TOURNAMENTS = 'FIVE_TOURNAMENTS',
  TEN_TOURNAMENTS = 'TEN_TOURNAMENTS',
  FINAL_TABLE = 'FINAL_TABLE',
  WIN = 'WIN',
  HOT_STREAK = 'HOT_STREAK',
}

@Entity('achievement_types')
export class AchievementType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AchievementCode,
    unique: true,
  })
  code: AchievementCode;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  iconUrl?: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(
    () => AchievementInstance,
    (instance) => instance.achievementType
  )
  instances: AchievementInstance[];
}
