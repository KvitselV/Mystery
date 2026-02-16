"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ClubController_1 = require("../controllers/ClubController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', ClubController_1.ClubController.getClubs);
router.get('/:id', ClubController_1.ClubController.getClubById);
router.get('/:id/tables', ClubController_1.ClubController.getClubTables);
router.get('/:id/schedules', ClubController_1.ClubController.getClubSchedules);
// Только ADMIN — управление клубами
router.post('/', (0, authMiddleware_1.requireAdmin)(), ClubController_1.ClubController.createClub);
router.patch('/:id', (0, authMiddleware_1.requireAdmin)(), ClubController_1.ClubController.updateClub);
router.delete('/:id', (0, authMiddleware_1.requireAdmin)(), ClubController_1.ClubController.deleteClub);
router.patch('/:id/tables/:tableId/status', (0, authMiddleware_1.requireAdmin)(), ClubController_1.ClubController.updateTableStatus);
router.post('/:id/schedules', (0, authMiddleware_1.requireAdmin)(), ClubController_1.ClubController.addSchedule);
router.patch('/:id/schedules/:scheduleId', (0, authMiddleware_1.requireAdmin)(), ClubController_1.ClubController.updateSchedule);
router.delete('/:id/schedules/:scheduleId', (0, authMiddleware_1.requireAdmin)(), ClubController_1.ClubController.deleteSchedule);
exports.default = router;
//# sourceMappingURL=clubRoutes.js.map