"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ClubController_1 = require("../controllers/ClubController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Все маршруты требуют авторизации
router.use(authMiddleware_1.authMiddleware);
// Публичные (для всех авторизованных)
router.get('/', ClubController_1.ClubController.getClubs);
router.get('/:id', ClubController_1.ClubController.getClubById);
router.get('/:id/tables', ClubController_1.ClubController.getClubTables);
router.get('/:id/schedules', ClubController_1.ClubController.getClubSchedules);
// Только для админов
router.post('/', ClubController_1.ClubController.createClub);
router.patch('/:id', ClubController_1.ClubController.updateClub);
router.delete('/:id', ClubController_1.ClubController.deleteClub);
router.patch('/:id/tables/:tableId/status', ClubController_1.ClubController.updateTableStatus);
router.post('/:id/schedules', ClubController_1.ClubController.addSchedule);
router.patch('/:id/schedules/:scheduleId', ClubController_1.ClubController.updateSchedule);
router.delete('/:id/schedules/:scheduleId', ClubController_1.ClubController.deleteSchedule);
exports.default = router;
//# sourceMappingURL=clubRoutes.js.map