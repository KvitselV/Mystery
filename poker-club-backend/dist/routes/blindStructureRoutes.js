"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BlindStructureController_1 = require("../controllers/BlindStructureController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', BlindStructureController_1.BlindStructureController.getAllStructures);
router.get('/:id', BlindStructureController_1.BlindStructureController.getStructureById);
router.post('/', (0, authMiddleware_1.requireAdminOrController)(), BlindStructureController_1.BlindStructureController.createStructure);
router.post('/:id/levels', (0, authMiddleware_1.requireAdminOrController)(), BlindStructureController_1.BlindStructureController.addLevel);
router.post('/:id/levels/with-coefficient', (0, authMiddleware_1.requireAdminOrController)(), BlindStructureController_1.BlindStructureController.addLevelWithCoefficient);
router.delete('/:id', (0, authMiddleware_1.requireAdminOrController)(), BlindStructureController_1.BlindStructureController.deactivateStructure);
exports.default = router;
//# sourceMappingURL=blindStructureRoutes.js.map