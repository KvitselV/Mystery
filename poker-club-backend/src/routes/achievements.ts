import { Router } from 'express';
import { AchievementController } from '../controllers/AchievementController';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// Публичное чтение типов достижений
router.get('/types', AchievementController.getAllTypes);

// Остальное — только для авторизованных
router.use(authMiddleware);

// Доступ к достижениям пользователя: только свой userId или ADMIN
router.get('/user/:userId', AchievementController.getUserAchievements);
router.get('/user/:userId/progress', AchievementController.getUserProgress);

// Только ADMIN
router.post('/check/:userId/:tournamentId', requireRole(['ADMIN']), AchievementController.checkAchievements);
router.post('/seed', requireRole(['ADMIN']), AchievementController.seedTypes);
router.post('/types', requireRole(['ADMIN']), AchievementController.createType);
router.delete('/instances/:id', requireRole(['ADMIN']), AchievementController.revokeInstance);

// Закреплённые достижения (свой userId или ADMIN)
router.patch('/user/:userId/pins', AchievementController.setPins);

export default router;
