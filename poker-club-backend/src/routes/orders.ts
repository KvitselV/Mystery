import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';

const router = Router();

// Получить статистику заказов (admin) - ВАЖНО: должен быть перед /:id
router.get('/statistics', OrderController.getStatistics);

// Получить мои заказы
router.get('/my', OrderController.getMyOrders);

// Получить заказы турнира (admin)
router.get('/tournament/:tournamentId', OrderController.getTournamentOrders);

// Получить все заказы с фильтрами (admin)
router.get('/', OrderController.getAllOrders);

// Получить заказ по ID
router.get('/:id', OrderController.getOrderById);

// Создать новый заказ
router.post('/', OrderController.createOrder);

// Обновить статус заказа (admin)
router.patch('/:id/status', OrderController.updateOrderStatus);

// Отменить заказ
router.post('/:id/cancel', OrderController.cancelOrder);

export default router;
