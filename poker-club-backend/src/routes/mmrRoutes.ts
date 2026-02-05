import { Router } from 'express';
import { MMRController } from '../controllers/MMRController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Все маршруты требуют авторизации
router.use(authMiddleware);

// Получить топ игроков по ММР (доступно всем)
router.get('/top', MMRController.getTopPlayers);

// Получить игроков по рангу (доступно всем)
router.get('/rank/:rankCode', MMRController.getPlayersByRank);

// Пересчитать ММР для турнира (только ADMIN)
router.post('/recalculate/:tournamentId', MMRController.recalculateTournamentMMR);

export default router;
