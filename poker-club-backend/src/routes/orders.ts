import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/authMiddleware';

const router = Router();

// Все маршруты требуют авторизации
router.use(authMiddleware);

// Получить статистику заказов (admin)
router.get('/statistics', requireRole(['ADMIN']), OrderController.getStatistics);

// Получить мои заказы
router.get('/my', OrderController.getMyOrders);

// Получить заказы турнира (admin)
router.get('/tournament/:tournamentId', requireRole(['ADMIN']), OrderController.getTournamentOrders);

// Получить все заказы с фильтрами (admin)
router.get('/', requireRole(['ADMIN']), OrderController.getAllOrders);

// Получить заказ по ID (только свой или admin)
router.get('/:id', OrderController.getOrderById);

// Создать новый заказ (userId = текущий пользователь)
router.post('/', OrderController.createOrder);

// Обновить статус заказа (admin)
router.patch('/:id/status', requireRole(['ADMIN']), OrderController.updateOrderStatus);

// Отменить заказ (только свой или admin)
router.post('/:id/cancel', OrderController.cancelOrder);

export default router;
