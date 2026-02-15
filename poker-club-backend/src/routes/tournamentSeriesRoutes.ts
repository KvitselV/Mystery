import { Router } from 'express';
import { authMiddleware, requireAdminOrController } from '../middlewares/authMiddleware';
import { TournamentSeriesController } from '../controllers/TournamentSeriesController';

const router = Router();
router.use(authMiddleware);

router.get('/', TournamentSeriesController.getAll);
router.get('/:id', TournamentSeriesController.getById);
router.post('/', requireAdminOrController(), TournamentSeriesController.create);
router.patch('/:id', requireAdminOrController(), TournamentSeriesController.update);
router.delete('/:id', requireAdminOrController(), TournamentSeriesController.delete);

export default router;
