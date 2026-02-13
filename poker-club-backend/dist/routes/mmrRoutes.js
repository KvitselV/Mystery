"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MMRController_1 = require("../controllers/MMRController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Все маршруты требуют авторизации
router.use(authMiddleware_1.authMiddleware);
// Получить топ игроков по ММР (доступно всем)
router.get('/top', MMRController_1.MMRController.getTopPlayers);
// Получить игроков по рангу (доступно всем)
router.get('/rank/:rankCode', MMRController_1.MMRController.getPlayersByRank);
// Пересчитать ММР для турнира (только ADMIN)
router.post('/recalculate/:tournamentId', MMRController_1.MMRController.recalculateTournamentMMR);
exports.default = router;
//# sourceMappingURL=mmrRoutes.js.map