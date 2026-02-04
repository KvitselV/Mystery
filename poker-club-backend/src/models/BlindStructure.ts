import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { TournamentLevel } from './TournamentLevel';

@Entity('blind_structures')
export class BlindStructure {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string; // Название структуры (например, "Стандартная", "Турбо")

  @Column({ type: 'text', nullable: true })
  description?: string; // Описание структуры

  @Column({ type: 'boolean', default: true })
  isActive!: boolean; // Активна ли структура

  @OneToMany(() => TournamentLevel, (level) => level.blindStructure, {
    cascade: true,
  })
  levels!: TournamentLevel[];

  @CreateDateColumn()
  createdAt!: Date;
}
