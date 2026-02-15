import { Router } from 'express';
import { TournamentController } from '../controllers/TournamentController';
import { authMiddleware, requireAdminOrController } from '../middlewares/authMiddleware';
import seatingRoutes from './seatingRoutes';
import liveTournamentRoutes from './liveTournamentRoutes';
import liveStateRoutes from './liveStateRoutes';

const router = Router();

router.use(authMiddleware);

router.get('/', TournamentController.getTournaments);
router.get('/:id', TournamentController.getTournamentById);
router.get('/:id/players', TournamentController.getTournamentPlayers);
router.post('/:id/register', TournamentController.registerForTournament);
router.delete('/:id/register', TournamentController.unregisterFromTournament);

router.post('/', requireAdminOrController(), TournamentController.createTournament);
router.patch('/:id', requireAdminOrController(), TournamentController.updateTournament);
router.delete('/:id', requireAdminOrController(), TournamentController.deleteTournament);
router.patch('/:id/status', requireAdminOrController(), TournamentController.updateTournamentStatus);
router.patch('/:id/rewards', requireAdminOrController(), TournamentController.updateTournamentRewards);

// Подключаем seating routes (рассадка и столы)
router.use('/', seatingRoutes);

// Подключаем live tournament routes (ребаи, аддоны, выбытие)
router.use('/', liveTournamentRoutes);  

// Подключаем live state routes (live состояние турнира)
router.use('/', liveStateRoutes);

export default router;
