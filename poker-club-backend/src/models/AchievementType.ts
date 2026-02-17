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
  SERIES_WINNER = 'SERIES_WINNER',
}

/** Тип статистики для настраиваемых достижений */
export enum AchievementStatisticType {
  TOURNAMENTS_PLAYED = 'TOURNAMENTS_PLAYED',
  WINS = 'WINS',
  CONSECUTIVE_WINS = 'CONSECUTIVE_WINS',
  SERIES_WINS = 'SERIES_WINS',
  FINAL_TABLE = 'FINAL_TABLE',
  ITM_STREAK = 'ITM_STREAK',
}

@Entity('achievement_types')
export class AchievementType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    unique: true,
  })
  code?: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  /** Base64 data URL или URL изображения иконки */
  @Column({ type: 'text', nullable: true })
  iconUrl?: string;

  /** Эмодзи или идентификатор иконки (например: 🏆, trophy) */
  @Column({ type: 'varchar', length: 32, nullable: true })
  icon?: string;

  /** Тип статистики для настраиваемых достижений */
  @Column({ type: 'varchar', length: 50, nullable: true })
  statisticType?: string;

  /** Целевое значение (например: 2 победы подряд) */
  @Column({ type: 'int', default: 0 })
  targetValue: number;

  /** Условие достижения (отображается при наведении) */
  @Column({ type: 'text', nullable: true })
  conditionDescription?: string;

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
