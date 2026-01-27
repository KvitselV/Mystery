import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Tournament } from './Tournament';

@Entity('tournament_series')
export class TournamentSeries {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  idSeries: string; // например "SERIES_2026_Q1"

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'timestamp' })
  periodStart: Date;

  @Column({ type: 'timestamp' })
  periodEnd: Date;

  @OneToMany(() => Tournament, (tournament) => tournament.series)
  tournaments: Tournament[];
}
