import { Router } from 'express';
import { ClubController } from '../controllers/ClubController';
import { authMiddleware, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', ClubController.getClubs);
router.get('/:id', ClubController.getClubById);
router.get('/:id/tables', ClubController.getClubTables);
router.get('/:id/schedules', ClubController.getClubSchedules);

// Только ADMIN — управление клубами
router.post('/', requireAdmin(), ClubController.createClub);
router.patch('/:id', requireAdmin(), ClubController.updateClub);
router.delete('/:id', requireAdmin(), ClubController.deleteClub);
router.patch('/:id/tables/:tableId/status', requireAdmin(), ClubController.updateTableStatus);
router.post('/:id/schedules', requireAdmin(), ClubController.addSchedule);
router.patch('/:id/schedules/:scheduleId', requireAdmin(), ClubController.updateSchedule);
router.delete('/:id/schedules/:scheduleId', requireAdmin(), ClubController.deleteSchedule);

export default router;
