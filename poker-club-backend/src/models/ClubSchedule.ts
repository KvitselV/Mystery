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

@Entity('club_schedules')
export class ClubSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Club, (club) => club.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'club_id' })
  club: Club;

  @Column({ type: 'int' })
  dayOfWeek: number; // 0 = воскресенье, 1 = понедельник, ..., 6 = суббота

  @Column({ type: 'time' })
  startTime: string; // Время начала (например, "18:00:00")

  @Column({ type: 'time' })
  endTime: string; // Время окончания (например, "23:00:00")

  @Column({ type: 'varchar', length: 255, nullable: true })
  eventType: string; // Тип события (например, "TOURNAMENT", "CASH_GAME", "TRAINING")

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string; // Описание события

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
