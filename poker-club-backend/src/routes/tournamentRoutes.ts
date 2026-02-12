import { Router } from 'express';
import { TournamentController } from '../controllers/TournamentController';
import { authMiddleware } from '../middlewares/authMiddleware';
import seatingRoutes from './seatingRoutes';
import liveTournamentRoutes from './liveTournamentRoutes';
import liveStateRoutes from './liveStateRoutes'; 

const router = Router();

// Все маршруты требуют авторизации
router.use(authMiddleware);

// Публичные (для всех авторизованных)
router.get('/', TournamentController.getTournaments);
router.get('/:id', TournamentController.getTournamentById);
router.get('/:id/players', TournamentController.getTournamentPlayers);
router.post('/:id/register', TournamentController.registerForTournament);
router.delete('/:id/register', TournamentController.unregisterFromTournament);

// Только для админов
router.post('/', TournamentController.createTournament);
router.patch('/:id/status', TournamentController.updateTournamentStatus);
router.patch('/:id/rewards', TournamentController.updateTournamentRewards);

// Подключаем seating routes (рассадка и столы)
router.use('/', seatingRoutes);

// Подключаем live tournament routes (ребаи, аддоны, выбытие)
router.use('/', liveTournamentRoutes);  

// Подключаем live state routes (live состояние турнира)
router.use('/', liveStateRoutes);

export default router;
