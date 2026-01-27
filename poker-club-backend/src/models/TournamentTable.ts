import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Tournament } from './Tournament';
import { TableSeat } from './TableSeat';

@Entity('tournament_tables')
export class TournamentTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  tableNumber: number;

  @ManyToOne(() => Tournament, (tournament) => tournament.tables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @OneToMany(() => TableSeat, (seat) => seat.table)
  seats: TableSeat[];

  @Column({ type: 'boolean', default: false })
  isActive: boolean;
}
