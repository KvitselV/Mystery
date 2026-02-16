import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Tournament } from './Tournament';

export interface ExpenseItem {
  description: string;
  amount: number; // копейки
}

/**
 * Отчёт для администратора по завершённому турниру.
 * Можно заполнять/редактировать позже.
 */
@Entity('tournament_admin_reports')
export class TournamentAdminReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Tournament, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @Column({ name: 'tournament_id', unique: true })
  tournamentId: string;

  /** Сколько человек пришло (isArrived) */
  @Column({ type: 'int', default: 0 })
  attendanceCount: number;

  /** Наличная выручка (копейки) — из TournamentPayment */
  @Column({ type: 'int', default: 0 })
  cashRevenue: number;

  /** Безналичная выручка (копейки) — из TournamentPayment */
  @Column({ type: 'int', default: 0 })
  nonCashRevenue: number;

  /** Расходы: [{ description, amount }], amount в копейках */
  @Column({ type: 'jsonb', default: [] })
  expenses: ExpenseItem[];

  /** Итого прибыль (копейки) = cashRevenue + nonCashRevenue - sum(expenses.amount) */
  @Column({ type: 'int', default: 0 })
  totalProfit: number;
}
