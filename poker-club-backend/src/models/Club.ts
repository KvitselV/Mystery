import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClubTable } from './ClubTable';
import { ClubSchedule } from './ClubSchedule';
import { Tournament } from './Tournament';

@Entity('clubs')
export class Club {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'int', default: 0 })
  tableCount: number; // Количество столов в клубе

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => ClubTable, (table) => table.club, { cascade: true })
  tables: ClubTable[];

  @OneToMany(() => ClubSchedule, (schedule) => schedule.club, { cascade: true })
  schedules: ClubSchedule[];

  @OneToMany(() => Tournament, (tournament) => tournament.club)
  tournaments: Tournament[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
