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
  playersCount!: number; // Количество игроков в игре

  @Column({ type: 'int', default: 0 })
  averageStack!: number; // Средний стек

  @Column({ type: 'boolean', default: false })
  isPaused!: boolean; // На паузе ли турнир

  @Column({ type: 'timestamp', nullable: true })
  nextBreakTime?: Date; // Время следующего перерыва

  @Column({ type: 'varchar', length: 50, default: 'RUNNING' })
  liveStatus!: string; // RUNNING, PAUSED, BREAK

  @UpdateDateColumn()
  updatedAt!: Date;
}
