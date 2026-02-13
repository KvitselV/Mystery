import { MenuCategory } from '../models/MenuCategory';
import { MenuItem } from '../models/MenuItem';
export declare class MenuService {
    private categoryRepo;
    private itemRepo;
    /**
     * Получить все категории с позициями
     */
    getAllCategoriesWithItems(): Promise<MenuCategory[]>;
    /**
     * Получить все категории
     */
    getAllCategories(): Promise<MenuCategory[]>;
    /**
     * Получить категорию по ID
     */
    getCategoryById(id: string): Promise<MenuCategory | null>;
    /**
     * Создать категорию
     */
    createCategory(data: {
        name: string;
        description?: string;
        sortOrder?: number;
    }): Promise<MenuCategory>;
    /**
     * Обновить категорию
     */
    updateCategory(id: string, data: Partial<{
        name: string;
        description: string;
        sortOrder: number;
        isActive: boolean;
    }>): Promise<MenuCategory>;
    /**
     * Удалить категорию
     */
    deleteCategory(id: string): Promise<void>;
    /**
     * Получить все позиции меню
     */
    getAllItems(categoryId?: string): Promise<MenuItem[]>;
    /**
     * Получить доступные позиции меню
     */
    getAvailableItems(categoryId?: string): Promise<MenuItem[]>;
    /**
     * Получить позицию меню по ID
     */
    getItemById(id: string): Promise<MenuItem | null>;
    /**
     * Создать позицию меню
     */
    createItem(data: {
        name: string;
        description?: string;
        price: number;
        categoryId: string;
        imageUrl?: string;
        sortOrder?: number;
    }): Promise<MenuItem>;
    /**
     * Обновить позицию меню
     */
    updateItem(id: string, data: Partial<{
        name: string;
        description: string;
        price: number;
        categoryId: string;
        imageUrl: string;
        sortOrder: number;
        isAvailable: boolean;
    }>): Promise<MenuItem>;
    /**
     * Удалить позицию меню
     */
    deleteItem(id: string): Promise<void>;
    /** Получить популярные позиции (по количеству заказов) */
    getPopularItems(limit?: number): Promise<{
        id: string;
        name: string;
        price: number;
        orderCount: number;
        totalQuantity: number;
    }[]>;
}
//# sourceMappingURL=MenuService.d.ts.map