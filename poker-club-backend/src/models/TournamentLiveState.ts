import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tournament } from './Tournament';

@Entity('tournament_live_states')
export class TournamentLiveState {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Tournament, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;

  @Column({ type: 'int', default: 1 })
  currentLevelNumber!: number; // Текущий уровень блайндов

  @Column({ type: 'int', default: 0 })
  levelRemainingTimeSeconds!: number; // Оставшееся время на уровне (в секундах)

  @Column({ type: 'int', default: 0 })
  playersCount!: number; // Активные участники (не вылетели)

  @Column({ type: 'int', default: 0 })
  totalParticipants!: number; // Всего участников (регистраций)

  @Column({ type: 'int', default: 0 })
  totalEntries!: number; // Всего входов (вход + ребаи)

  @Column({ type: 'int', default: 0 })
  totalChipsInPlay!: number; // Сумма фишек у активных игроков

  @Column({ type: 'int', default: 0 })
  averageStack!: number; // Средний стек = totalChipsInPlay / playersCount

  @Column({ type: 'boolean', default: false })
  isPaused!: boolean; // На паузе ли турнир

  @Column({ type: 'timestamp', nullable: true })
  nextBreakTime?: Date; // Время следующего перерыва

  @Column({ type: 'varchar', length: 50, default: 'RUNNING' })
  liveStatus!: string; // RUNNING, PAUSED, BREAK

  @UpdateDateColumn()
  updatedAt!: Date;
}
