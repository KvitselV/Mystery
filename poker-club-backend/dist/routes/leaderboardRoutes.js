"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const LeaderboardController_1 = require("../controllers/LeaderboardController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Все маршруты требуют авторизации
router.use(authMiddleware_1.authMiddleware);
// Получить все рейтинги (доступно всем)
router.get('/', LeaderboardController_1.LeaderboardController.getAllLeaderboards);
// Получить записи конкретного рейтинга (доступно всем)
router.get('/:id/entries', LeaderboardController_1.LeaderboardController.getLeaderboardEntries);
// Создать сезонный рейтинг (только ADMIN)
router.post('/seasonal/create', LeaderboardController_1.LeaderboardController.createSeasonalLeaderboard);
// Обновить рейтинг по ММР (только ADMIN)
router.post('/rank-mmr/update', LeaderboardController_1.LeaderboardController.updateRankMMRLeaderboard);
// Получить топ по рангам (доступно всем)
router.get('/rank-mmr', LeaderboardController_1.LeaderboardController.getRankMMRLeaderboard);
exports.default = router;
//# sourceMappingURL=leaderboardRoutes.js.map