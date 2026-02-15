import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Tournament } from './Tournament';
import { Club } from './Club';

@Entity('tournament_series')
export class TournamentSeries {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  idSeries?: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'timestamp' })
  periodStart: Date;

  @Column({ type: 'timestamp' })
  periodEnd: Date;

  /** Дни недели: 0=Вс, 1=Пн, ..., 6=Сб. Хранится как "0,1,2,3,4,5,6" */
  @Column({ type: 'varchar', length: 50, default: '1,2,3,4,5,6' })
  daysOfWeek: string;

  @Column({ type: 'uuid', nullable: true })
  clubId: string | null; // null = глобальная, иначе привязка к клубу

  @ManyToOne(() => Club, { nullable: true })
  @JoinColumn({ name: 'club_id' })
  club: Club | null;

  @OneToMany(() => Tournament, (tournament) => tournament.series)
  tournaments: Tournament[];
}
