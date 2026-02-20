"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const StatisticsController_1 = require("../controllers/StatisticsController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
// Получить профиль по userId для просмотра (доступно всем авторизованным) - должен быть ПЕРЕД /user/:userId
router.get('/user/:userId/public', StatisticsController_1.StatisticsController.getPublicProfileByUserId);
// Универсальная статистика с фильтрами: ?from=&to=&metrics=
router.get('/player/:userId', StatisticsController_1.StatisticsController.getPlayerStatisticsWithFilters);
// Сравнение статистики нескольких игроков: POST { userIds: string[], metrics?: string[] }
router.post('/compare', StatisticsController_1.StatisticsController.comparePlayerStatistics);
// Доступ к статистике: только свой userId или ADMIN
router.get('/user/:userId', StatisticsController_1.StatisticsController.getFullStatistics);
router.get('/user/:userId/finishes', StatisticsController_1.StatisticsController.getFinishStatistics);
router.get('/user/:userId/participation', StatisticsController_1.StatisticsController.getParticipationChart);
router.get('/user/:userId/last-tournament', StatisticsController_1.StatisticsController.getLastTournament);
// Обновить статистику вручную — только ADMIN
router.post('/user/:userId/update', (0, authMiddleware_1.requireRole)(['ADMIN']), StatisticsController_1.StatisticsController.updateStatistics);
// Получить профиль по playerProfileId (доступно всем авторизованным)
router.get('/profile/:playerProfileId', StatisticsController_1.StatisticsController.getProfileByPlayerProfileId);
exports.default = router;
//# sourceMappingURL=statistics.js.map