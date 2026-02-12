import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { PlayerProfile } from './PlayerProfile';

@Entity('player_balances')
export class PlayerBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => PlayerProfile, (profile) => profile.balance)
  playerProfile: PlayerProfile
  
  @Column({ type: 'int', default: 0 })
  depositBalance: number; // текущий баланс депозита в копейках/центах

  @Column({ type: 'int', default: 0 })
  totalDeposited: number; // всего внесено



  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
