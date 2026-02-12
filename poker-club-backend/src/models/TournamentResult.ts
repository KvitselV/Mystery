import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Tournament } from './Tournament';
import { PlayerProfile } from './PlayerProfile';

@Entity('tournament_results')
export class TournamentResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tournament, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @ManyToOne(() => PlayerProfile)
  @JoinColumn({ name: 'player_id' })
  player: PlayerProfile;

  @Column({ type: 'int' })
  finishPosition: number; // место финиша

  @Column({ type: 'int', default: 0 })
  mmrGained: number; // ММR за турнир

  @Column({ type: 'boolean', default: false })
  isFinalTable: boolean;
}
