"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuService = void 0;
const database_1 = require("../config/database");
const MenuCategory_1 = require("../models/MenuCategory");
const MenuItem_1 = require("../models/MenuItem");
class MenuService {
    constructor() {
        this.categoryRepo = database_1.AppDataSource.getRepository(MenuCategory_1.MenuCategory);
        this.itemRepo = database_1.AppDataSource.getRepository(MenuItem_1.MenuItem);
    }
    /**
     * Получить все категории с позициями
     */
    async getAllCategoriesWithItems() {
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
    async getAllCategories() {
        return this.categoryRepo.find({
            order: { sortOrder: 'ASC' },
        });
    }
    /**
     * Получить категорию по ID
     */
    async getCategoryById(id) {
        return this.categoryRepo.findOne({
            where: { id },
            relations: ['items'],
        });
    }
    /**
     * Создать категорию
     */
    async createCategory(data) {
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
    async updateCategory(id, data) {
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
    async deleteCategory(id) {
        const result = await this.categoryRepo.delete(id);
        if (result.affected === 0) {
            throw new Error('Category not found');
        }
    }
    /**
     * Получить все позиции меню
     */
    async getAllItems(categoryId) {
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
    async getAvailableItems(categoryId) {
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
    async getItemById(id) {
        return this.itemRepo.findOne({
            where: { id },
            relations: ['category'],
        });
    }
    /**
     * Создать позицию меню
     */
    async createItem(data) {
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
    async updateItem(id, data) {
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
    async deleteItem(id) {
        const result = await this.itemRepo.delete(id);
        if (result.affected === 0) {
            throw new Error('Menu item not found');
        }
    }
    /** Получить популярные позиции (по количеству заказов) */
    async getPopularItems(limit = 10) {
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
exports.MenuService = MenuService;
//# sourceMappingURL=MenuService.js.map