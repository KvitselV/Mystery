import { Router } from 'express';
import { AchievementController } from '../controllers/AchievementController';

const router = Router();

// Получить все типы достижений
router.get('/types', AchievementController.getAllTypes);

// Получить достижения пользователя
router.get('/user/:userId', AchievementController.getUserAchievements);

// Получить прогресс достижений пользователя
router.get('/user/:userId/progress', AchievementController.getUserProgress);

// Проверить достижения (admin)
router.post(
  '/check/:userId/:tournamentId',
  AchievementController.checkAchievements
);

// Инициализировать типы (admin, один раз)
router.post('/seed', AchievementController.seedTypes);

export default router;
