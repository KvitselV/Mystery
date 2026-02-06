import { Router } from 'express';
import { MenuController } from '../controllers/MenuController';

const router = Router();

// === КАТЕГОРИИ ===

// Получить все категории с позициями
router.get('/categories', MenuController.getAllCategoriesWithItems);

// Получить список категорий
router.get('/categories/list', MenuController.getAllCategories);

// Получить категорию по ID
router.get('/categories/:id', MenuController.getCategoryById);

// Создать категорию (admin)
router.post('/categories', MenuController.createCategory);

// Обновить категорию (admin)
router.patch('/categories/:id', MenuController.updateCategory);

// Удалить категорию (admin)
router.delete('/categories/:id', MenuController.deleteCategory);

// === ПОЗИЦИИ МЕНЮ ===

// Получить популярные позиции
router.get('/items/popular', MenuController.getPopularItems);

// Получить все позиции меню
router.get('/items', MenuController.getAllItems);

// Получить позицию по ID
router.get('/items/:id', MenuController.getItemById);

// Создать позицию (admin)
router.post('/items', MenuController.createItem);

// Обновить позицию (admin)
router.patch('/items/:id', MenuController.updateItem);

// Удалить позицию (admin)
router.delete('/items/:id', MenuController.deleteItem);

export default router;
