import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BlindStructure } from './BlindStructure';

@Entity('tournament_levels')
export class TournamentLevel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => BlindStructure, (structure) => structure.levels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'blind_structure_id' })
  blindStructure!: BlindStructure;

  @Column({ type: 'int' })
  levelNumber!: number; // Номер уровня (1, 2, 3...)

  @Column({ type: 'int' })
  smallBlind!: number; // Малый блайнд

  @Column({ type: 'int' })
  bigBlind!: number; // Большой блайнд

  @Column({ type: 'int', default: 0 })
  ante!: number; // Анте

  @Column({ type: 'int' })
  durationMinutes!: number; // Длительность уровня в минутах

  @Column({ type: 'boolean', default: false })
  isBreak!: boolean; // Это перерыв?

  @Column({ type: 'varchar', length: 100, nullable: true })
  breakName?: string; // Название перерыва (например, "Обед")
}
