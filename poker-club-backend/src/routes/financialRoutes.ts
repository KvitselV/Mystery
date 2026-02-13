import { Router } from 'express';
import { FinancialController } from '../controllers/FinancialController';
import { BillController } from '../controllers/BillController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Все маршруты требуют авторизации
router.use(authMiddleware);

// Получить баланс
router.get('/deposit', FinancialController.getDeposit);

// Пополнить депозит
router.post('/deposit/topup', FinancialController.topupDeposit);

// История операций
router.get('/operations', FinancialController.getOperations);

// Счета пользователя (выставленные после вылета при оплате CASH)
router.get('/bills', BillController.getMyBills);
router.get('/bills/:id', BillController.getMyBillById);

export default router;
