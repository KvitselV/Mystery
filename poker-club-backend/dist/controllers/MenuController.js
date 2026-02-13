"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuController = void 0;
const MenuService_1 = require("../services/MenuService");
const menuService = new MenuService_1.MenuService();
class MenuController {
    /**
     * GET /menu/categories
     * Получить все категории с позициями
     */
    static async getAllCategoriesWithItems(req, res) {
        try {
            const categories = await menuService.getAllCategoriesWithItems();
            res.json(categories);
        }
        catch (error) {
            console.error('Error fetching categories with items:', error);
            res.status(500).json({ error: 'Failed to fetch categories' });
        }
    }
    /**
     * GET /menu/categories/list
     * Получить список категорий
     */
    static async getAllCategories(req, res) {
        try {
            const categories = await menuService.getAllCategories();
            res.json(categories);
        }
        catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ error: 'Failed to fetch categories' });
        }
    }
    /**
     * GET /menu/categories/:id
     * Получить категорию по ID
     */
    static async getCategoryById(req, res) {
        try {
            const id = req.params.id;
            const category = await menuService.getCategoryById(id);
            if (!category) {
                res.status(404).json({ error: 'Category not found' });
                return;
            }
            res.json(category);
        }
        catch (error) {
            console.error('Error fetching category:', error);
            res.status(500).json({ error: 'Failed to fetch category' });
        }
    }
    /**
     * POST /menu/categories
     * Создать категорию (admin)
     */
    static async createCategory(req, res) {
        try {
            const { name, description, sortOrder } = req.body;
            if (!name) {
                res.status(400).json({ error: 'Name is required' });
                return;
            }
            const category = await menuService.createCategory({
                name,
                description,
                sortOrder,
            });
            res.status(201).json(category);
        }
        catch (error) {
            console.error('Error creating category:', error);
            res.status(500).json({
                error: 'Failed to create category',
                details: error instanceof Error ? error.message : 'Operation failed',
            });
        }
    }
    /**
     * PATCH /menu/categories/:id
     * Обновить категорию (admin)
     */
    static async updateCategory(req, res) {
        try {
            const id = req.params.id;
            const { name, description, sortOrder, isActive } = req.body;
            const category = await menuService.updateCategory(id, {
                name,
                description,
                sortOrder,
                isActive,
            });
            res.json(category);
        }
        catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({
                error: 'Failed to update category',
                details: error instanceof Error ? error.message : 'Operation failed',
            });
        }
    }
    /**
     * DELETE /menu/categories/:id
     * Удалить категорию (admin)
     */
    static async deleteCategory(req, res) {
        try {
            const id = req.params.id;
            await menuService.deleteCategory(id);
            res.json({ message: 'Category deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).json({
                error: 'Failed to delete category',
                details: error instanceof Error ? error.message : 'Operation failed',
            });
        }
    }
    /**
     * GET /menu/items
     * Получить все позиции меню
     */
    static async getAllItems(req, res) {
        try {
            const categoryId = req.query.categoryId;
            const availableOnly = req.query.availableOnly === 'true';
            const items = availableOnly
                ? await menuService.getAvailableItems(categoryId)
                : await menuService.getAllItems(categoryId);
            res.json(items);
        }
        catch (error) {
            console.error('Error fetching items:', error);
            res.status(500).json({ error: 'Failed to fetch items' });
        }
    }
    /**
     * GET /menu/items/:id
     * Получить позицию по ID
     */
    static async getItemById(req, res) {
        try {
            const id = req.params.id;
            const item = await menuService.getItemById(id);
            if (!item) {
                res.status(404).json({ error: 'Menu item not found' });
                return;
            }
            res.json(item);
        }
        catch (error) {
            console.error('Error fetching item:', error);
            res.status(500).json({ error: 'Failed to fetch item' });
        }
    }
    /**
     * POST /menu/items
     * Создать позицию меню (admin)
     */
    static async createItem(req, res) {
        try {
            const { name, description, price, categoryId, imageUrl, sortOrder } = req.body;
            if (!name || !price || !categoryId) {
                res.status(400).json({
                    error: 'Name, price, and categoryId are required',
                });
                return;
            }
            const item = await menuService.createItem({
                name,
                description,
                price,
                categoryId,
                imageUrl,
                sortOrder,
            });
            res.status(201).json(item);
        }
        catch (error) {
            console.error('Error creating item:', error);
            res.status(500).json({
                error: 'Failed to create item',
                details: error instanceof Error ? error.message : 'Operation failed',
            });
        }
    }
    /**
     * PATCH /menu/items/:id
     * Обновить позицию меню (admin)
     */
    static async updateItem(req, res) {
        try {
            const id = req.params.id;
            const { name, description, price, categoryId, imageUrl, sortOrder, isAvailable, } = req.body;
            const item = await menuService.updateItem(id, {
                name,
                description,
                price,
                categoryId,
                imageUrl,
                sortOrder,
                isAvailable,
            });
            res.json(item);
        }
        catch (error) {
            console.error('Error updating item:', error);
            res.status(500).json({
                error: 'Failed to update item',
                details: error instanceof Error ? error.message : 'Operation failed',
            });
        }
    }
    /**
     * DELETE /menu/items/:id
     * Удалить позицию меню (admin)
     */
    static async deleteItem(req, res) {
        try {
            const id = req.params.id;
            await menuService.deleteItem(id);
            res.json({ message: 'Menu item deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting item:', error);
            res.status(500).json({
                error: 'Failed to delete item',
                details: error instanceof Error ? error.message : 'Operation failed',
            });
        }
    }
    /**
     * GET /menu/items/popular
     * Получить популярные позиции
     */
    static async getPopularItems(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const items = await menuService.getPopularItems(limit);
            res.json(items);
        }
        catch (error) {
            console.error('Error fetching popular items:', error);
            res.status(500).json({ error: 'Failed to fetch popular items' });
        }
    }
}
exports.MenuController = MenuController;
//# sourceMappingURL=MenuController.js.map