import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AchievementType } from './AchievementType';
import { User } from './User';
import { Tournament } from './Tournament';

@Entity('achievement_instances')
@Index(['userId', 'achievementTypeId'], { unique: true })
export class AchievementInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  achievementTypeId: string;

  @Column({ type: 'uuid', nullable: true })
  tournamentId?: string;

  @Column({ type: 'text', nullable: true })
  metadata?: string; // JSON string для доп. данных

  @CreateDateColumn()
  unlockedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => AchievementType)
  @JoinColumn({ name: 'achievementTypeId' })
  achievementType: AchievementType;

  @ManyToOne(() => Tournament, { nullable: true })
  @JoinColumn({ name: 'tournamentId' })
  tournament?: Tournament;
}
