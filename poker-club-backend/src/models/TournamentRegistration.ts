import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Tournament } from './Tournament';
import { PlayerProfile } from './PlayerProfile';

@Entity('tournament_registrations')
export class TournamentRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tournament, (tournament) => tournament.registrations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @ManyToOne(() => PlayerProfile)
  @JoinColumn({ name: 'player_id' })
  player: PlayerProfile;

  @Column({ type: 'timestamp' })
  registeredAt: Date;

  @Column({ type: 'enum', enum: ['CASH', 'DEPOSIT'], default: 'DEPOSIT' })
  paymentMethod: string;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  currentStack: number;
}
