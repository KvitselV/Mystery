"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BillController_1 = require("../controllers/BillController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
// Список всех счетов (админ), с фильтрами: ?tournamentId=&playerProfileId=&status=&limit=&offset=
router.get('/', (0, authMiddleware_1.requireRole)(['ADMIN']), BillController_1.BillController.getAllBills);
// Один счёт по id (админ — любой, пользователь — только свой)
router.get('/:id', BillController_1.BillController.getBillById);
// Отметить счёт как оплаченный (админ)
router.patch('/:id/status', (0, authMiddleware_1.requireRole)(['ADMIN']), BillController_1.BillController.updateBillStatus);
exports.default = router;
//# sourceMappingURL=billRoutes.js.map