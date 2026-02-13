"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SeatingController_1 = require("../controllers/SeatingController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Все маршруты требуют авторизации
router.use(authMiddleware_1.authMiddleware);
// Инициализация столов турнира из столов клуба (только ADMIN)
router.post('/:id/tables/init-from-club', SeatingController_1.SeatingController.initTablesFromClub);
// Автоматическая рассадка (только ADMIN)
router.post('/:id/seating/auto', SeatingController_1.SeatingController.autoSeating);
// Ручная пересадка (только ADMIN)
router.post('/:id/seating/manual', SeatingController_1.SeatingController.manualReseating);
// Получить все столы турнира (доступно всем)
router.get('/:id/tables', SeatingController_1.SeatingController.getTournamentTables);
// Получить детали стола (доступно всем)
router.get('/:tournamentId/tables/:tableId', SeatingController_1.SeatingController.getTableDetails);
exports.default = router;
//# sourceMappingURL=seatingRoutes.js.map