"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const LiveTournamentController_1 = require("../controllers/LiveTournamentController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.post('/:id/player/:playerId/rebuy', (0, authMiddleware_1.requireAdminOrController)(), LiveTournamentController_1.LiveTournamentController.rebuy);
router.post('/:id/player/:playerId/addon', (0, authMiddleware_1.requireAdminOrController)(), LiveTournamentController_1.LiveTournamentController.addon);
router.post('/:id/player/:playerId/eliminate', (0, authMiddleware_1.requireAdminOrController)(), LiveTournamentController_1.LiveTournamentController.eliminatePlayer);
router.patch('/:id/level/next', (0, authMiddleware_1.requireAdminOrController)(), LiveTournamentController_1.LiveTournamentController.moveToNextLevel);
router.patch('/:id/level/prev', (0, authMiddleware_1.requireAdminOrController)(), LiveTournamentController_1.LiveTournamentController.moveToPrevLevel);
router.get('/:id/level/current', LiveTournamentController_1.LiveTournamentController.getCurrentLevel);
router.get('/:id/player-balances', (0, authMiddleware_1.requireAdminOrController)(), LiveTournamentController_1.LiveTournamentController.getPlayerBalances);
router.post('/:id/player/:playerId/pay', (0, authMiddleware_1.requireAdminOrController)(), LiveTournamentController_1.LiveTournamentController.recordPayment);
router.get('/:id/player/:playerId/operations', LiveTournamentController_1.LiveTournamentController.getPlayerOperations);
router.post('/:id/finish', (0, authMiddleware_1.requireAdminOrController)(), LiveTournamentController_1.LiveTournamentController.finishTournament);
exports.default = router;
//# sourceMappingURL=liveTournamentRoutes.js.map