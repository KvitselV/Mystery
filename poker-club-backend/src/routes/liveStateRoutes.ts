import { Router } from 'express';
import { LiveStateController } from '../controllers/LiveStateController';
import { authMiddleware, requireAdminOrController } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/:id/live', LiveStateController.getLiveState);
router.patch('/:id/pause', requireAdminOrController(), LiveStateController.pauseTournament);
router.patch('/:id/resume', requireAdminOrController(), LiveStateController.resumeTournament);
router.patch('/:id/live/recalculate', requireAdminOrController(), LiveStateController.recalculateStats);
router.patch('/:id/live/time', requireAdminOrController(), LiveStateController.updateLevelTime);

export default router;
