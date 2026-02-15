import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToOne } from 'typeorm';
import { OneToOne } from 'typeorm';
import { PlayerBalance } from './PlayerBalance';
import { Club } from './Club';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  firstName: string;

  @Column({ type: 'varchar', length: 255 })
  lastName: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'enum', enum: ['ADMIN', 'CONTROLLER', 'PLAYER', 'WAITER', 'TV'], default: 'PLAYER' })
  role: 'ADMIN' | 'CONTROLLER' | 'PLAYER' | 'WAITER' | 'TV';

  @Column({ type: 'uuid', nullable: true })
  managedClubId: string | null;

  @ManyToOne(() => Club, { nullable: true })
  @JoinColumn({ name: 'managed_club_id' })
  managedClub: Club | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => PlayerBalance, { cascade: true })
  @JoinColumn({ name: 'balance_id' })
  balance: PlayerBalance;
}
