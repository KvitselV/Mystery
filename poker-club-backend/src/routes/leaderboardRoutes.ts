import { Router } from 'express';
import { LeaderboardController } from '../controllers/LeaderboardController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Все маршруты требуют авторизации
router.use(authMiddleware);

// Получить все рейтинги (доступно всем)
router.get('/', LeaderboardController.getAllLeaderboards);

// Получить записи конкретного рейтинга (доступно всем)
router.get('/:id/entries', LeaderboardController.getLeaderboardEntries);

// Создать сезонный рейтинг (только ADMIN)
router.post('/seasonal/create', LeaderboardController.createSeasonalLeaderboard);

// Обновить рейтинг по ММР (только ADMIN)
router.post('/rank-mmr/update', LeaderboardController.updateRankMMRLeaderboard);

// Получить топ по рангам (доступно всем)
router.get('/rank-mmr', LeaderboardController.getRankMMRLeaderboard);

export default router;
