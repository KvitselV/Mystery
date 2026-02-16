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

export enum PlayerBillStatus {
  PENDING = 'PENDING',   // Счёт выставлен, ожидает оплаты
  PAID = 'PAID',         // Оплачено (наличными или пополнением депозита)
}

/**
 * Счёт игроку после вылета: если он платил наличными (CASH), ему выставляется счёт
 * за вход (бай-ин), ребаи, аддоны и заказы в долг (CREDIT).
 */
@Entity('player_bills')
export class PlayerBill {
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

  @Column({ type: 'int' })
  amount: number; // Сумма к оплате (копейки)

  @Column({ type: 'int', default: 0 })
  buyInAmount: number;

  @Column({ type: 'int', default: 0 })
  rebuysAmount: number;

  @Column({ type: 'int', default: 0 })
  addonsAmount: number;

  @Column({ type: 'int', default: 0 })
  ordersAmount: number; // Заказы в долг (CREDIT)

  @Column({
    type: 'enum',
    enum: PlayerBillStatus,
    default: PlayerBillStatus.PENDING,
  })
  status: PlayerBillStatus;

  @CreateDateColumn()
  createdAt: Date;
}
