import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TournamentTable } from './TournamentTable';
import { PlayerProfile } from './PlayerProfile';

@Entity('table_seats')
export class TableSeat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  seatNumber: number; // 1-9

  @ManyToOne(() => TournamentTable, (table) => table.seats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'table_id' })
  table: TournamentTable;

  @ManyToOne(() => PlayerProfile)
  @JoinColumn({ name: 'player_id' })
  player: PlayerProfile;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
