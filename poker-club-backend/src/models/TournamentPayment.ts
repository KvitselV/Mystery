import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { PlayerProfile } from './PlayerProfile';
import { Tournament } from './Tournament';

/**
 * Оплата счёта игрока за турнир: наличные и/или безнал.
 * Сумма списывается с турнирного баланса (вход + ребаи + аддоны + заказы).
 */
@Entity('tournament_payments')
export class TournamentPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PlayerProfile)
  @JoinColumn({ name: 'player_id' })
  playerProfile: PlayerProfile;

  @Column({ name: 'player_id' })
  playerProfileId: string;

  @ManyToOne(() => Tournament, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @Column({ name: 'tournament_id' })
  tournamentId: string;

  @Column({ type: 'int', default: 0 })
  cashAmount: number; // копейки

  @Column({ type: 'int', default: 0 })
  nonCashAmount: number; // копейки (карта, перевод)

  @CreateDateColumn()
  createdAt: Date;
}
