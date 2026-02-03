import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { TournamentSeries } from './TournamentSeries';
import { TournamentTable } from './TournamentTable';
import { TournamentRegistration } from './TournamentRegistration';

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'enum', enum: ['REG_OPEN', 'LATE_REG', 'RUNNING', 'FINISHED', 'ARCHIVED'], default: 'REG_OPEN' })
  status: string;

  @Column({ type: 'int' })
  buyInAmount: number;

  @Column({ type: 'int' })
  startingStack: number;

  @Column({ type: 'int', default: 0 })
  currentLevelNumber: number;

  @Column({ type: 'uuid', nullable: true })
  blindStructureId: string;

  @ManyToOne(() => TournamentSeries, { nullable: true })
  @JoinColumn({ name: 'series_id' })
  series: TournamentSeries;

  @OneToMany(() => TournamentTable, (table) => table.tournament, { cascade: true })
  tables: TournamentTable[];

  @OneToMany(() => TournamentRegistration, (reg) => reg.tournament)
  registrations: TournamentRegistration[];
}
