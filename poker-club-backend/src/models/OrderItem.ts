import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './Order';
import { MenuItem } from './MenuItem';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => MenuItem)
  @JoinColumn({ name: 'menu_item_id' })
  menuItem: MenuItem;

  @Column({ name: 'menu_item_id' })
  menuItemId: string;

  @Column({ type: 'int' })
  quantity: number; // Количество

  @Column({ type: 'int' })
  priceAtOrder: number; // Цена на момент заказа (копейки)

  @Column({ type: 'text', nullable: true })
  notes?: string; // Комментарий к позиции (например, "без лука")
}
