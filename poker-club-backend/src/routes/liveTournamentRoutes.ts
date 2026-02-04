import { Router } from 'express';
import { LiveTournamentController } from '../controllers/LiveTournamentController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Все маршруты требуют авторизации
router.use(authMiddleware);

// Ребай (только ADMIN)
router.post('/:id/player/:playerId/rebuy', LiveTournamentController.rebuy);

// Аддон (только ADMIN)
router.post('/:id/player/:playerId/addon', LiveTournamentController.addon);

// Выбытие игрока (только ADMIN)
router.post('/:id/player/:playerId/eliminate', LiveTournamentController.eliminatePlayer);

// Перейти на следующий уровень (только ADMIN)
router.patch('/:id/level/next', LiveTournamentController.moveToNextLevel);

// Получить текущий уровень (доступно всем)
router.get('/:id/level/current', LiveTournamentController.getCurrentLevel);

// История операций игрока (доступно всем)
router.get('/:id/player/:playerId/operations', LiveTournamentController.getPlayerOperations);

export default router;
