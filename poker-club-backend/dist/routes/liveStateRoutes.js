"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const LiveStateController_1 = require("../controllers/LiveStateController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Все маршруты требуют авторизации
router.use(authMiddleware_1.authMiddleware);
// Получить Live State (доступно всем)
router.get('/:id/live', LiveStateController_1.LiveStateController.getLiveState);
// Поставить на паузу (только ADMIN)
router.patch('/:id/pause', LiveStateController_1.LiveStateController.pauseTournament);
// Возобновить (только ADMIN)
router.patch('/:id/resume', LiveStateController_1.LiveStateController.resumeTournament);
// Пересчитать статистику (только ADMIN)
router.patch('/:id/live/recalculate', LiveStateController_1.LiveStateController.recalculateStats);
// Обновить время (только ADMIN)
router.patch('/:id/live/time', LiveStateController_1.LiveStateController.updateLevelTime);
exports.default = router;
//# sourceMappingURL=liveStateRoutes.js.map