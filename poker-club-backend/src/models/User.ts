import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { OneToOne } from 'typeorm';
import { PlayerBalance } from './PlayerBalance';
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

  @Column({ type: 'enum', enum: ['ADMIN', 'PLAYER', 'WAITER', 'TV'], default: 'PLAYER' })
  role: 'ADMIN' | 'PLAYER' | 'WAITER' | 'TV';

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
