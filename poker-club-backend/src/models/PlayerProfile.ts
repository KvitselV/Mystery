import { Entity, PrimaryGeneratedColumn, Column, JoinColumn } from 'typeorm';
import { User } from './User';
import { OneToOne } from 'typeorm';
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

  @OneToOne(() => PlayerBalance, (balance) => balance.playerProfile, { cascade: true })
  @JoinColumn({ name: 'balance_id' })
  balance: PlayerBalance;
}
