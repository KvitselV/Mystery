"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TournamentController_1 = require("../controllers/TournamentController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const seatingRoutes_1 = __importDefault(require("./seatingRoutes"));
const liveTournamentRoutes_1 = __importDefault(require("./liveTournamentRoutes"));
const liveStateRoutes_1 = __importDefault(require("./liveStateRoutes"));
const router = (0, express_1.Router)();
// Все маршруты требуют авторизации
router.use(authMiddleware_1.authMiddleware);
// Публичные (для всех авторизованных)
router.get('/', TournamentController_1.TournamentController.getTournaments);
router.get('/:id', TournamentController_1.TournamentController.getTournamentById);
router.get('/:id/players', TournamentController_1.TournamentController.getTournamentPlayers);
router.post('/:id/register', TournamentController_1.TournamentController.registerForTournament);
router.delete('/:id/register', TournamentController_1.TournamentController.unregisterFromTournament);
// Только для админов
router.post('/', TournamentController_1.TournamentController.createTournament);
router.patch('/:id/status', TournamentController_1.TournamentController.updateTournamentStatus);
router.patch('/:id/rewards', TournamentController_1.TournamentController.updateTournamentRewards);
// Подключаем seating routes (рассадка и столы)
router.use('/', seatingRoutes_1.default);
// Подключаем live tournament routes (ребаи, аддоны, выбытие)
router.use('/', liveTournamentRoutes_1.default);
// Подключаем live state routes (live состояние турнира)
router.use('/', liveStateRoutes_1.default);
exports.default = router;
//# sourceMappingURL=tournamentRoutes.js.map