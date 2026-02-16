import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { TournamentSeries } from './TournamentSeries';
import { TournamentTable } from './TournamentTable';
import { TournamentRegistration } from './TournamentRegistration';
import { TournamentReward } from './TournamentReward';
import { BlindStructure } from './BlindStructure';
import { Club } from './Club';  

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'enum', enum: ['ANNOUNCED', 'REG_OPEN', 'LATE_REG', 'RUNNING', 'FINISHED', 'ARCHIVED'], default: 'ANNOUNCED' })
  status: string;

  @Column({ type: 'int', default: 0 })
  buyInCost: number; // стоимость входа; при оплате DEPOSIT списывается с депозита 

  @Column({ type: 'int' })
  startingStack: number;

  @Column({ type: 'int', default: 0 })
  addonChips: number;

  @Column({ type: 'int', default: 0 })
  addonCost: number; // стоимость аддона (₽)

  @Column({ type: 'int', default: 0 })
  rebuyChips: number;

  @Column({ type: 'int', default: 0 })
  rebuyCost: number; // стоимость ребая (₽)

  @Column({ type: 'int', default: 0 })
  maxRebuys: number; // макс. ребаев на игрока (0 = без лимита)

  @Column({ type: 'int', default: 0 })
  maxAddons: number; // макс. аддонов на игрока (0 = без лимита)

  @Column({ type: 'int', default: 0 })
  currentLevelNumber: number;

  @Column({ type: 'uuid', nullable: true })
  blindStructureId: string;

  @ManyToOne(() => BlindStructure, { nullable: true })
  @JoinColumn({ name: 'blind_structure_id' })
  blindStructure?: BlindStructure;

  @ManyToOne(() => TournamentSeries, { nullable: true })
  @JoinColumn({ name: 'series_id' })
  series: TournamentSeries;

  @Column({ type: 'uuid', nullable: true })
  clubId: string;

  @ManyToOne(() => Club, { nullable: true })
  @JoinColumn({ name: 'club_id' })
  club: Club;

  @OneToMany(() => TournamentTable, (table) => table.tournament, { cascade: true })
  tables: TournamentTable[];

  @OneToMany(() => TournamentRegistration, (reg) => reg.tournament)
  registrations: TournamentRegistration[];

  @OneToMany(() => TournamentReward, (tr) => tr.tournament, { cascade: true })
  rewards: TournamentReward[];
}
