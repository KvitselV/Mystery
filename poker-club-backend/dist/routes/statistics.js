"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const StatisticsController_1 = require("../controllers/StatisticsController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
// Доступ к статистике: только свой userId или ADMIN
router.get('/user/:userId', StatisticsController_1.StatisticsController.getFullStatistics);
router.get('/user/:userId/finishes', StatisticsController_1.StatisticsController.getFinishStatistics);
router.get('/user/:userId/participation', StatisticsController_1.StatisticsController.getParticipationChart);
router.get('/user/:userId/last-tournament', StatisticsController_1.StatisticsController.getLastTournament);
// Обновить статистику вручную — только ADMIN
router.post('/user/:userId/update', (0, authMiddleware_1.requireRole)(['ADMIN']), StatisticsController_1.StatisticsController.updateStatistics);
exports.default = router;
//# sourceMappingURL=statistics.js.map