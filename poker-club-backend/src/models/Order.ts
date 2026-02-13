import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Tournament } from './Tournament';
import { OrderItem } from './OrderItem';

export enum OrderStatus {
  PENDING = 'PENDING', // Новый заказ
  PREPARING = 'PREPARING', // Готовится
  READY = 'READY', // Готов к выдаче
  DELIVERED = 'DELIVERED', // Доставлен
  CANCELLED = 'CANCELLED', // Отменён
}

/** Оплата с депозита или в долг (счёт после вылета для CASH-игроков) */
export enum OrderPaymentMethod {
  DEPOSIT = 'DEPOSIT',
  CREDIT = 'CREDIT',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Tournament, { nullable: true })
  @JoinColumn({ name: 'tournament_id' })
  tournament?: Tournament;

  @Column({ name: 'tournament_id', nullable: true })
  tournamentId?: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: 'int' })
  totalAmount: number; // Общая сумма в копейках

  @Column({
    type: 'enum',
    enum: OrderPaymentMethod,
    default: OrderPaymentMethod.DEPOSIT,
  })
  paymentMethod: OrderPaymentMethod;

  @Column({ type: 'text', nullable: true })
  notes?: string; // Комментарий к заказу

  @Column({ type: 'int', nullable: true })
  tableNumber?: number; // Номер стола для доставки

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
  })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
