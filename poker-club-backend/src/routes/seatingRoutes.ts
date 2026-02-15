import { Router } from 'express';
import { SeatingController } from '../controllers/SeatingController';
import { authMiddleware, requireAdminOrController } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.post('/:id/tables/init-from-club', requireAdminOrController(), SeatingController.initTablesFromClub);
router.post('/:id/seating/auto', requireAdminOrController(), SeatingController.autoSeating);
router.post('/:id/seating/manual', requireAdminOrController(), SeatingController.manualReseating);

// Получить все столы турнира (доступно всем)
router.get('/:id/tables', SeatingController.getTournamentTables);

// Получить детали стола (доступно всем)
router.get('/:tournamentId/tables/:tableId', SeatingController.getTableDetails);

export default router;
