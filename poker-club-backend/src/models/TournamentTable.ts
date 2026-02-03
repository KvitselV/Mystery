import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Tournament } from './Tournament';
import { TableSeat } from './TableSeat';

@Entity('tournament_tables')
export class TournamentTable {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Tournament, (tournament) => tournament.tables)
  tournament!: Tournament;

  @Column({ type: 'int' })
  tableNumber!: number; // Номер стола (1, 2, 3...)

  @Column({ type: 'int', default: 9 })
  maxSeats!: number; // Максимум мест за столом (обычно 9)

  @Column({ type: 'int', default: 0 })
  occupiedSeats!: number; // Занято мест

  @Column({ type: 'varchar', default: 'AVAILABLE' })
  status!: string; // AVAILABLE, ACTIVE, COMPLETED

  @OneToMany(() => TableSeat, (seat) => seat.table, { cascade: true })
  seats!: TableSeat[];

  @CreateDateColumn()
  createdAt!: Date;
}

