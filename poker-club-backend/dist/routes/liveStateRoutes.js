"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const LiveStateController_1 = require("../controllers/LiveStateController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/:id/live', LiveStateController_1.LiveStateController.getLiveState);
router.patch('/:id/pause', (0, authMiddleware_1.requireAdminOrController)(), LiveStateController_1.LiveStateController.pauseTournament);
router.patch('/:id/resume', (0, authMiddleware_1.requireAdminOrController)(), LiveStateController_1.LiveStateController.resumeTournament);
router.patch('/:id/live/recalculate', (0, authMiddleware_1.requireAdminOrController)(), LiveStateController_1.LiveStateController.recalculateStats);
router.patch('/:id/live/time', (0, authMiddleware_1.requireAdminOrController)(), LiveStateController_1.LiveStateController.updateLevelTime);
exports.default = router;
//# sourceMappingURL=liveStateRoutes.js.map