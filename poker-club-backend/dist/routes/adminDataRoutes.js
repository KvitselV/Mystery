"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AdminDataController_1 = require("../controllers/AdminDataController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.use((0, authMiddleware_1.requireAdmin)());
router.get('/data', AdminDataController_1.AdminDataController.getAllData);
router.patch('/entity/:table/:id', AdminDataController_1.AdminDataController.updateEntity);
router.post('/recalculate-ratings', AdminDataController_1.AdminDataController.recalculateRatings);
exports.default = router;
//# sourceMappingURL=adminDataRoutes.js.map