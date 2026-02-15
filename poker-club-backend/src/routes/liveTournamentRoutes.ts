import { Router } from 'express';
import { LiveTournamentController } from '../controllers/LiveTournamentController';
import { authMiddleware, requireAdminOrController } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.post('/:id/player/:playerId/rebuy', requireAdminOrController(), LiveTournamentController.rebuy);
router.post('/:id/player/:playerId/addon', requireAdminOrController(), LiveTournamentController.addon);
router.post('/:id/player/:playerId/eliminate', requireAdminOrController(), LiveTournamentController.eliminatePlayer);
router.patch('/:id/level/next', requireAdminOrController(), LiveTournamentController.moveToNextLevel);
router.get('/:id/level/current', LiveTournamentController.getCurrentLevel);
router.get('/:id/player/:playerId/operations', LiveTournamentController.getPlayerOperations);
router.post('/:id/finish', requireAdminOrController(), LiveTournamentController.finishTournament);

export default router;
