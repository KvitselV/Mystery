import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Leaderboard } from './Leaderboard';
import { PlayerProfile } from './PlayerProfile';

@Entity('leaderboard_entries')
export class LeaderboardEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Leaderboard, (leaderboard) => leaderboard.entries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'leaderboardId' })
  leaderboard: Leaderboard;

  @ManyToOne(() => PlayerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'playerProfileId' })
  playerProfile: PlayerProfile;

  @Column({ type: 'int', default: 0 })
  rankPosition: number; // Позиция в рейтинге

  @Column({ type: 'int', default: 0 })
  tournamentsCount: number; // Количество турниров

  @Column({ type: 'int', default: 0 })
  averageFinish: number; // Средний финиш

  @Column({ type: 'int', default: 0 })
  ratingPoints: number; // Рейтинговые очки

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
