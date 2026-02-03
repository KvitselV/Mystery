import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { TournamentTable } from './TournamentTable';
import { PlayerProfile } from './PlayerProfile';

@Entity('table_seats')
export class TableSeat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => TournamentTable, (table) => table.seats)
  table!: TournamentTable;

  @Column({ type: 'int' })
  seatNumber!: number; // Позиция за столом (1-9)

  @ManyToOne(() => PlayerProfile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'player_id' })
  player!: PlayerProfile | null;

  @Column({ type: 'varchar', nullable: true })
  playerName!: string | null; // Имя игрока (denormalization)

  @Column({ type: 'boolean', default: false })
  isOccupied!: boolean; // Занято ли место

  @Column({ type: 'varchar', default: 'WAITING' })
  status!: string; // WAITING, ACTIVE, ELIMINATED

  @CreateDateColumn()
  createdAt!: Date;
}
