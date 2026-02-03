import { Router } from 'express';
import { SeatingController } from '../controllers/SeatingController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Все маршруты требуют авторизации
router.use(authMiddleware);

// Автоматическая рассадка (только ADMIN)
router.post('/:id/seating/auto', SeatingController.autoSeating);

// Ручная пересадка (только ADMIN)
router.post('/:id/seating/manual', SeatingController.manualReseating);

// Получить все столы турнира (доступно всем)
router.get('/:id/tables', SeatingController.getTournamentTables);

// Получить детали стола (доступно всем)
router.get('/:tournamentId/tables/:tableId', SeatingController.getTableDetails);

// Исключить игрока (только ADMIN)
router.post('/:id/player/:playerId/eliminate', SeatingController.eliminatePlayer);

export default router;
