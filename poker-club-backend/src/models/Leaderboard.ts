import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { LeaderboardEntry } from './LeaderboardEntry';

export type LeaderboardType = 'TOURNAMENT_SERIES' | 'SEASONAL' | 'RANK_MMR';

@Entity('leaderboards')
export class Leaderboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: ['TOURNAMENT_SERIES', 'SEASONAL', 'RANK_MMR'],
  })
  type: LeaderboardType;

  @Column({ type: 'timestamp', nullable: true })
  periodStart: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  periodEnd: Date | null;

  @Column({ type: 'uuid', nullable: true })
  seriesId: string | null; // Ссылка на TournamentSeries (для TOURNAMENT_SERIES типа)

  @OneToMany(() => LeaderboardEntry, (entry) => entry.leaderboard)
  entries: LeaderboardEntry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
