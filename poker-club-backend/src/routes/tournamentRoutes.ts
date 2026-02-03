import { Router } from 'express';
import { TournamentController } from '../controllers/TournamentController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Все маршруты требуют авторизации
router.use(authMiddleware);

// Публичные (для всех авторизованных)
router.get('/', TournamentController.getTournaments);
router.get('/:id', TournamentController.getTournamentById);
router.get('/:id/players', TournamentController.getTournamentPlayers);
router.post('/:id/register', TournamentController.registerForTournament);

// Только для админов
router.post('/', TournamentController.createTournament);
router.patch('/:id/status', TournamentController.updateTournamentStatus);

export default router;
