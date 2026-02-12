import { Router } from 'express';
import { ClubController } from '../controllers/ClubController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Все маршруты требуют авторизации
router.use(authMiddleware);

// Публичные (для всех авторизованных)
router.get('/', ClubController.getClubs);
router.get('/:id', ClubController.getClubById);
router.get('/:id/tables', ClubController.getClubTables);
router.get('/:id/schedules', ClubController.getClubSchedules);

// Только для админов
router.post('/', ClubController.createClub);
router.patch('/:id', ClubController.updateClub);
router.delete('/:id', ClubController.deleteClub);
router.patch('/:id/tables/:tableId/status', ClubController.updateTableStatus);
router.post('/:id/schedules', ClubController.addSchedule);
router.patch('/:id/schedules/:scheduleId', ClubController.updateSchedule);
router.delete('/:id/schedules/:scheduleId', ClubController.deleteSchedule);

export default router;
