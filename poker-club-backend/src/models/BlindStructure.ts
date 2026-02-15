import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TournamentLevel } from './TournamentLevel';
import { Club } from './Club';

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

  @Column({ type: 'uuid', nullable: true })
  clubId: string | null; // null = глобальная (админ), иначе привязка к клубу

  @ManyToOne(() => Club, { nullable: true })
  @JoinColumn({ name: 'club_id' })
  club: Club | null;

  @OneToMany(() => TournamentLevel, (level) => level.blindStructure, {
    cascade: true,
  })
  levels!: TournamentLevel[];

  @CreateDateColumn()
  createdAt!: Date;
}
