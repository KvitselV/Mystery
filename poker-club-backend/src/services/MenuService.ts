import { AppDataSource } from '../config/database';
import { MenuCategory } from '../models/MenuCategory';
import { MenuItem } from '../models/MenuItem';

export class MenuService {
  private categoryRepo = AppDataSource.getRepository(MenuCategory);
  private itemRepo = AppDataSource.getRepository(MenuItem);

  /**
   * Получить все категории с позициями
   */
  async getAllCategoriesWithItems(): Promise<MenuCategory[]> {
    return this.categoryRepo.find({
      where: { isActive: true },
      relations: ['items'],
      order: {
        sortOrder: 'ASC',
        items: {
          sortOrder: 'ASC',
        },
      },
    });
  }

  /**
   * Получить все категории
   */
  async getAllCategories(): Promise<MenuCategory[]> {
    return this.categoryRepo.find({
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * Получить категорию по ID
   */
  async getCategoryById(id: string): Promise<MenuCategory | null> {
    return this.categoryRepo.findOne({
      where: { id },
      relations: ['items'],
    });
  }

  /**
   * Создать категорию
   */
  async createCategory(data: {
    name: string;
    description?: string;
    sortOrder?: number;
  }): Promise<MenuCategory> {
    const category = this.categoryRepo.create({
      name: data.name,
      description: data.description,
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
    });

    return this.categoryRepo.save(category);
  }

  /**
   * Обновить категорию
   */
  async updateCategory(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      sortOrder: number;
      isActive: boolean;
    }>
  ): Promise<MenuCategory> {
    const category = await this.categoryRepo.findOne({ where: { id } });

    if (!category) {
      throw new Error('Category not found');
    }

    Object.assign(category, data);
    return this.categoryRepo.save(category);
  }

  /**
   * Удалить категорию
   */
  async deleteCategory(id: string): Promise<void> {
    const result = await this.categoryRepo.delete(id);

    if (result.affected === 0) {
      throw new Error('Category not found');
    }
  }

  /**
   * Получить все позиции меню
   */
  async getAllItems(categoryId?: string): Promise<MenuItem[]> {
    const query = this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .orderBy('item.sortOrder', 'ASC');

    if (categoryId) {
      query.where('item.category_id = :categoryId', { categoryId });
    }

    return query.getMany();
  }

  /**
   * Получить доступные позиции меню
   */
  async getAvailableItems(categoryId?: string): Promise<MenuItem[]> {
    const query = this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .where('item.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('category.isActive = :isActive', { isActive: true })
      .orderBy('item.sortOrder', 'ASC');

    if (categoryId) {
      query.andWhere('item.category_id = :categoryId', { categoryId });
    }

    return query.getMany();
  }

  /**
   * Получить позицию меню по ID
   */
  async getItemById(id: string): Promise<MenuItem | null> {
    return this.itemRepo.findOne({
      where: { id },
      relations: ['category'],
    });
  }

  /**
   * Создать позицию меню
   */
  async createItem(data: {
    name: string;
    description?: string;
    price: number;
    categoryId: string;
    imageUrl?: string;
    sortOrder?: number;
  }): Promise<MenuItem> {
    // Проверить существование категории
    const category = await this.categoryRepo.findOne({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    const item = this.itemRepo.create({
      name: data.name,
      description: data.description,
      price: data.price,
      categoryId: data.categoryId,
      imageUrl: data.imageUrl,
      sortOrder: data.sortOrder ?? 0,
      isAvailable: true,
    });

    return this.itemRepo.save(item);
  }

  /**
   * Обновить позицию меню
   */
  async updateItem(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      categoryId: string;
      imageUrl: string;
      sortOrder: number;
      isAvailable: boolean;
    }>
  ): Promise<MenuItem> {
    const item = await this.itemRepo.findOne({ where: { id } });

    if (!item) {
      throw new Error('Menu item not found');
    }

    // Если меняется категория, проверить её существование
    if (data.categoryId && data.categoryId !== item.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new Error('Category not found');
      }
    }

    Object.assign(item, data);
    return this.itemRepo.save(item);
  }

  /**
   * Удалить позицию меню
   */
  async deleteItem(id: string): Promise<void> {
    const result = await this.itemRepo.delete(id);

    if (result.affected === 0) {
      throw new Error('Menu item not found');
    }
  }

  /**
   * Получить популярные позиции (по количеству заказов)
   */
  async getPopularItems(limit: number = 10): Promise<any[]> {
    const result = await this.itemRepo
      .createQueryBuilder('item')
      .leftJoin('order_items', 'oi', 'oi.menu_item_id = item.id')
      .select('item.id', 'id')
      .addSelect('item.name', 'name')
      .addSelect('item.price', 'price')
      .addSelect('COUNT(oi.id)', 'orderCount')
      .addSelect('SUM(oi.quantity)', 'totalQuantity')
      .groupBy('item.id')
      .orderBy('orderCount', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((r) => ({
      id: r.id,
      name: r.name,
      price: parseInt(r.price),
      orderCount: parseInt(r.orderCount || 0),
      totalQuantity: parseInt(r.totalQuantity || 0),
    }));
  }
}
