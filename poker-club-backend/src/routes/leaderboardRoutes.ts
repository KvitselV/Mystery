import { Router } from 'express';
import { LeaderboardController } from '../controllers/LeaderboardController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Все маршруты требуют авторизации
router.use(authMiddleware);

// Получить все рейтинги (доступно всем)
router.get('/', LeaderboardController.getAllLeaderboards);

// Рейтинг за период: неделя / месяц / год (доступно всем) — до /:id
router.get('/period-ratings', LeaderboardController.getPeriodRatings);

// Получить топ по рангам (доступно всем) — до /:id
router.get('/rank-mmr', LeaderboardController.getRankMMRLeaderboard);

// Получить записи конкретного рейтинга (доступно всем)
router.get('/:id/entries', LeaderboardController.getLeaderboardEntries);

// Создать сезонный рейтинг (только ADMIN)
router.post('/seasonal/create', LeaderboardController.createSeasonalLeaderboard);

// Обновить рейтинг по ММР (только ADMIN)
router.post('/rank-mmr/update', LeaderboardController.updateRankMMRLeaderboard);

export default router;
