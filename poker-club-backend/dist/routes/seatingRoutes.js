"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SeatingController_1 = require("../controllers/SeatingController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.post('/:id/tables/init-from-club', (0, authMiddleware_1.requireAdminOrController)(), SeatingController_1.SeatingController.initTablesFromClub);
router.post('/:id/seating/auto', (0, authMiddleware_1.requireAdminOrController)(), SeatingController_1.SeatingController.autoSeating);
router.post('/:id/seating/manual', (0, authMiddleware_1.requireAdminOrController)(), SeatingController_1.SeatingController.manualReseating);
// Получить все столы турнира (доступно всем)
router.get('/:id/tables', SeatingController_1.SeatingController.getTournamentTables);
// Получить детали стола (доступно всем)
router.get('/:tournamentId/tables/:tableId', SeatingController_1.SeatingController.getTableDetails);
exports.default = router;
//# sourceMappingURL=seatingRoutes.js.map