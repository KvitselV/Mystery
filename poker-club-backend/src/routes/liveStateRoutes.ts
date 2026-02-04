import { Router } from 'express';
import { LiveStateController } from '../controllers/LiveStateController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Все маршруты требуют авторизации
router.use(authMiddleware);

// Получить Live State (доступно всем)
router.get('/:id/live', LiveStateController.getLiveState);

// Поставить на паузу (только ADMIN)
router.patch('/:id/pause', LiveStateController.pauseTournament);

// Возобновить (только ADMIN)
router.patch('/:id/resume', LiveStateController.resumeTournament);

// Пересчитать статистику (только ADMIN)
router.patch('/:id/live/recalculate', LiveStateController.recalculateStats);

// Обновить время (только ADMIN)
router.patch('/:id/live/time', LiveStateController.updateLevelTime);

export default router;
