import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Club } from './Club';

@Entity('club_tables')
export class ClubTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Club, (club) => club.tables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'club_id' })
  club: Club;

  @Column({ type: 'int' })
  tableNumber: number; // Номер стола в клубе (1, 2, 3...)

  @Column({ type: 'int', default: 9 })
  maxSeats: number; // Максимум мест за столом (обычно 9)

  @Column({ type: 'varchar', default: 'AVAILABLE' })
  status: string; // AVAILABLE, OCCUPIED, MAINTENANCE

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes: string; // Дополнительные заметки о столе

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
