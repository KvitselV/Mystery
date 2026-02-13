"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const FinancialController_1 = require("../controllers/FinancialController");
const BillController_1 = require("../controllers/BillController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Все маршруты требуют авторизации
router.use(authMiddleware_1.authMiddleware);
// Получить баланс
router.get('/deposit', FinancialController_1.FinancialController.getDeposit);
// Пополнить депозит
router.post('/deposit/topup', FinancialController_1.FinancialController.topupDeposit);
// История операций
router.get('/operations', FinancialController_1.FinancialController.getOperations);
// Счета пользователя (выставленные после вылета при оплате CASH)
router.get('/bills', BillController_1.BillController.getMyBills);
router.get('/bills/:id', BillController_1.BillController.getMyBillById);
exports.default = router;
//# sourceMappingURL=financialRoutes.js.map