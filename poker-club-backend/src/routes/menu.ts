import { Router } from 'express';
import { MenuController } from '../controllers/MenuController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/authMiddleware';

const router = Router();

// Публичное чтение меню (без авторизации для гостей/кафе)
router.get('/categories', MenuController.getAllCategoriesWithItems);
router.get('/categories/list', MenuController.getAllCategories);
router.get('/categories/:id', MenuController.getCategoryById);
router.get('/items/popular', MenuController.getPopularItems);
router.get('/items', MenuController.getAllItems);
router.get('/items/:id', MenuController.getItemById);

// Запись — только с авторизацией и ролью ADMIN
router.use(authMiddleware);

router.post('/categories', requireRole(['ADMIN']), MenuController.createCategory);
router.patch('/categories/:id', requireRole(['ADMIN']), MenuController.updateCategory);
router.delete('/categories/:id', requireRole(['ADMIN']), MenuController.deleteCategory);
router.post('/items', requireRole(['ADMIN']), MenuController.createItem);
router.patch('/items/:id', requireRole(['ADMIN']), MenuController.updateItem);
router.delete('/items/:id', requireRole(['ADMIN']), MenuController.deleteItem);

export default router;
