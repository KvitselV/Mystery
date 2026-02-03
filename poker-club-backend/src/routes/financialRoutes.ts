import { Router } from 'express';
import { FinancialController } from '../controllers/FinancialController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Все маршруты требуют авторизации
router.use(authMiddleware);

// Получить баланс
router.get('/deposit', FinancialController.getDeposit);

// Пополнить депозит
router.post('/deposit/topup', FinancialController.topupDeposit);

// Вывести средства
router.post('/deposit/withdraw', FinancialController.withdrawDeposit);

// История операций
router.get('/operations', FinancialController.getOperations);

export default router;
