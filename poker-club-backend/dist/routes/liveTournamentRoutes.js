"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const LiveTournamentController_1 = require("../controllers/LiveTournamentController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Все маршруты требуют авторизации
router.use(authMiddleware_1.authMiddleware);
// Ребай (только ADMIN)
router.post('/:id/player/:playerId/rebuy', LiveTournamentController_1.LiveTournamentController.rebuy);
// Аддон (только ADMIN)
router.post('/:id/player/:playerId/addon', LiveTournamentController_1.LiveTournamentController.addon);
// Выбытие игрока (только ADMIN)
router.post('/:id/player/:playerId/eliminate', LiveTournamentController_1.LiveTournamentController.eliminatePlayer);
// Перейти на следующий уровень (только ADMIN)
router.patch('/:id/level/next', LiveTournamentController_1.LiveTournamentController.moveToNextLevel);
// Получить текущий уровень (доступно всем)
router.get('/:id/level/current', LiveTournamentController_1.LiveTournamentController.getCurrentLevel);
// История операций игрока (доступно всем)
router.get('/:id/player/:playerId/operations', LiveTournamentController_1.LiveTournamentController.getPlayerOperations);
// Завершить турнир (только ADMIN)
router.post('/:id/finish', LiveTournamentController_1.LiveTournamentController.finishTournament);
exports.default = router;
//# sourceMappingURL=liveTournamentRoutes.js.map