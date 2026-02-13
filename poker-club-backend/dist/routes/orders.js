"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const OrderController_1 = require("../controllers/OrderController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const authMiddleware_2 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Все маршруты требуют авторизации
router.use(authMiddleware_1.authMiddleware);
// Получить статистику заказов (admin)
router.get('/statistics', (0, authMiddleware_2.requireRole)(['ADMIN']), OrderController_1.OrderController.getStatistics);
// Получить мои заказы
router.get('/my', OrderController_1.OrderController.getMyOrders);
// Получить заказы турнира (admin)
router.get('/tournament/:tournamentId', (0, authMiddleware_2.requireRole)(['ADMIN']), OrderController_1.OrderController.getTournamentOrders);
// Получить все заказы с фильтрами (admin)
router.get('/', (0, authMiddleware_2.requireRole)(['ADMIN']), OrderController_1.OrderController.getAllOrders);
// Получить заказ по ID (только свой или admin)
router.get('/:id', OrderController_1.OrderController.getOrderById);
// Создать новый заказ (userId = текущий пользователь)
router.post('/', OrderController_1.OrderController.createOrder);
// Обновить статус заказа (admin)
router.patch('/:id/status', (0, authMiddleware_2.requireRole)(['ADMIN']), OrderController_1.OrderController.updateOrderStatus);
// Отменить заказ (только свой или admin)
router.post('/:id/cancel', OrderController_1.OrderController.cancelOrder);
exports.default = router;
//# sourceMappingURL=orders.js.map