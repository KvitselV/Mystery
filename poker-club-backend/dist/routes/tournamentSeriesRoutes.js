"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const TournamentSeriesController_1 = require("../controllers/TournamentSeriesController");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', TournamentSeriesController_1.TournamentSeriesController.getAll);
router.get('/:id', TournamentSeriesController_1.TournamentSeriesController.getById);
router.post('/', (0, authMiddleware_1.requireAdminOrController)(), TournamentSeriesController_1.TournamentSeriesController.create);
router.patch('/:id', (0, authMiddleware_1.requireAdminOrController)(), TournamentSeriesController_1.TournamentSeriesController.update);
router.delete('/:id', (0, authMiddleware_1.requireAdminOrController)(), TournamentSeriesController_1.TournamentSeriesController.delete);
exports.default = router;
//# sourceMappingURL=tournamentSeriesRoutes.js.map