import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Tournament } from './Tournament';
import { TableSeat } from './TableSeat';
import { ClubTable } from './ClubTable';

@Entity('tournament_tables')
export class TournamentTable {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Tournament, (tournament) => tournament.tables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;

  @Column({ type: 'uuid', nullable: true })
  clubTableId!: string | null;

  @ManyToOne(() => ClubTable, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'club_table_id' })
  clubTable!: ClubTable | null;

  @Column({ type: 'int' })
  tableNumber!: number; // Номер стола (1, 2, 3...)

  @Column({ type: 'int', default: 9 })
  maxSeats!: number; // Максимум мест за столом (обычно 9)

  @Column({ type: 'int', default: 0 })
  occupiedSeats!: number; // Занято мест

  @Column({ type: 'varchar', default: 'INACTIVE' })
  status!: string; // INACTIVE (нет игроков), AVAILABLE, ACTIVE, COMPLETED

  @OneToMany(() => TableSeat, (seat) => seat.table, { cascade: true })
  seats!: TableSeat[];

  @CreateDateColumn()
  createdAt!: Date;
}

