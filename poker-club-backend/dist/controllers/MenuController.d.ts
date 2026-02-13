import { Request, Response } from 'express';
export declare class MenuController {
    /**
     * GET /menu/categories
     * Получить все категории с позициями
     */
    static getAllCategoriesWithItems(req: Request, res: Response): Promise<void>;
    /**
     * GET /menu/categories/list
     * Получить список категорий
     */
    static getAllCategories(req: Request, res: Response): Promise<void>;
    /**
     * GET /menu/categories/:id
     * Получить категорию по ID
     */
    static getCategoryById(req: Request, res: Response): Promise<void>;
    /**
     * POST /menu/categories
     * Создать категорию (admin)
     */
    static createCategory(req: Request, res: Response): Promise<void>;
    /**
     * PATCH /menu/categories/:id
     * Обновить категорию (admin)
     */
    static updateCategory(req: Request, res: Response): Promise<void>;
    /**
     * DELETE /menu/categories/:id
     * Удалить категорию (admin)
     */
    static deleteCategory(req: Request, res: Response): Promise<void>;
    /**
     * GET /menu/items
     * Получить все позиции меню
     */
    static getAllItems(req: Request, res: Response): Promise<void>;
    /**
     * GET /menu/items/:id
     * Получить позицию по ID
     */
    static getItemById(req: Request, res: Response): Promise<void>;
    /**
     * POST /menu/items
     * Создать позицию меню (admin)
     */
    static createItem(req: Request, res: Response): Promise<void>;
    /**
     * PATCH /menu/items/:id
     * Обновить позицию меню (admin)
     */
    static updateItem(req: Request, res: Response): Promise<void>;
    /**
     * DELETE /menu/items/:id
     * Удалить позицию меню (admin)
     */
    static deleteItem(req: Request, res: Response): Promise<void>;
    /**
     * GET /menu/items/popular
     * Получить популярные позиции
     */
    static getPopularItems(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=MenuController.d.ts.map