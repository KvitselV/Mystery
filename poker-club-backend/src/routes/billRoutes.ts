import { Router } from 'express';
import { BillController } from '../controllers/BillController';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);

// Список всех счетов (админ), с фильтрами: ?tournamentId=&playerProfileId=&status=&limit=&offset=
router.get('/', requireRole(['ADMIN']), BillController.getAllBills);

// Один счёт по id (админ — любой, пользователь — только свой)
router.get('/:id', BillController.getBillById);

// Отметить счёт как оплаченный (админ)
router.patch('/:id/status', requireRole(['ADMIN']), BillController.updateBillStatus);

export default router;
