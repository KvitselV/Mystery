import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MenuCategory } from './MenuCategory';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string; // Название позиции

  @Column({ type: 'text', nullable: true })
  description?: string; // Описание

  @Column({ type: 'int' })
  price: number; // Цена в копейках

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl?: string; // URL изображения

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean; // Доступно для заказа

  @Column({ type: 'int', default: 0 })
  sortOrder: number; // Порядок в категории

  @ManyToOne(() => MenuCategory, (category) => category.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: MenuCategory;

  @Column({ name: 'category_id' })
  categoryId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
