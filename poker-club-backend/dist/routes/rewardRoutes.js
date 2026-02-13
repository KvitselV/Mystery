"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const RewardController_1 = require("../controllers/RewardController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', RewardController_1.RewardController.getRewards);
router.get('/:id', RewardController_1.RewardController.getById);
router.post('/', RewardController_1.RewardController.create);
router.patch('/:id', RewardController_1.RewardController.update);
router.delete('/:id', RewardController_1.RewardController.delete);
exports.default = router;
//# sourceMappingURL=rewardRoutes.js.map