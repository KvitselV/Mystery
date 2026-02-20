import { Router } from 'express';
import { StatisticsController } from '../controllers/StatisticsController';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);

// Получить профиль по userId для просмотра (доступно всем авторизованным) - должен быть ПЕРЕД /user/:userId
router.get('/user/:userId/public', StatisticsController.getPublicProfileByUserId);

// Универсальная статистика с фильтрами: ?from=&to=&metrics=
router.get('/player/:userId', StatisticsController.getPlayerStatisticsWithFilters);

// Сравнение статистики нескольких игроков: POST { userIds: string[], metrics?: string[] }
router.post('/compare', StatisticsController.comparePlayerStatistics);

// Доступ к статистике: только свой userId или ADMIN
router.get('/user/:userId', StatisticsController.getFullStatistics);
router.get('/user/:userId/finishes', StatisticsController.getFinishStatistics);
router.get('/user/:userId/participation', StatisticsController.getParticipationChart);
router.get('/user/:userId/last-tournament', StatisticsController.getLastTournament);

// Обновить статистику вручную — только ADMIN
router.post('/user/:userId/update', requireRole(['ADMIN']), StatisticsController.updateStatistics);

// Получить профиль по playerProfileId (доступно всем авторизованным)
router.get('/profile/:playerProfileId', StatisticsController.getProfileByPlayerProfileId);

export default router;
