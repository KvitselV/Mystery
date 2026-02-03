import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { PlayerProfile } from './PlayerProfile';
import { Tournament } from './Tournament';

@Entity('player_operations')
export class PlayerOperation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PlayerProfile)
  @JoinColumn({ name: 'player_id' })
  playerProfile: PlayerProfile;

  @Column({ type: 'enum', enum: ['DEPOSIT_TOPUP', 'DEPOSIT_WITHDRAWAL', 'BUYIN', 'REBUY', 'ADDON', 'ORDER_PAYMENT', 'PRIZE'] })
  operationType: string;

  @Column({ type: 'int' })
  amount: number;

  @ManyToOne(() => Tournament, { nullable: true })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @CreateDateColumn()
  createdAt: Date;
}
