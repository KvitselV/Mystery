import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToOne } from 'typeorm';
import { User } from './User';
import { PlayerBalance } from './PlayerBalance';

@Entity('player_profiles')
export class PlayerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', default: 0 })
  mmrValue: number; // скрытый ММR для расчёта рейтинга

  @Column({ type: 'varchar', length: 2, default: 'E' })
  rankCode: string; // E, D, C, B, A, S, SS

  @Column({ type: 'int', default: 0 })
  tournamentsCount: number;

  @Column({ type: 'float', default: 0 })
  winRate: number; // процент финальных столов

  @Column({ type: 'float', default: 0 })
  averageFinish: number; // среднее место финиша

  @Column({ type: 'int', nullable: true })
  bestFinish?: number; // Лучшее место (например, 1 = первое место)

  @Column({ type: 'uuid', nullable: true })
  favoriteTournamentId?: string; // ID турнира, в который чаще всего играет

  @Column({ type: 'int', default: 0 })
  currentStreak: number; // Текущая серия финишей в призах подряд

  @Column({ type: 'int', default: 0 })
  bestStreak: number; // Лучшая серия финишей в призах

  @OneToOne(() => PlayerBalance, (balance) => balance.playerProfile, { cascade: true })
  @JoinColumn({ name: 'balance_id' })
  balance: PlayerBalance;
}
