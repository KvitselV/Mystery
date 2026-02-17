import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';
import { AchievementType } from './AchievementType';

@Entity('player_achievement_pins')
@Index(['userId', 'achievementTypeId'], { unique: true })
export class PlayerAchievementPin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  achievementTypeId: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => AchievementType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'achievementTypeId' })
  achievementType: AchievementType;
}
