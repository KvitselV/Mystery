"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BlindStructureController_1 = require("../controllers/BlindStructureController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Все маршруты требуют авторизации
router.use(authMiddleware_1.authMiddleware);
// Получить все структуры (доступно всем)
router.get('/', BlindStructureController_1.BlindStructureController.getAllStructures);
// Получить структуру по ID (доступно всем)
router.get('/:id', BlindStructureController_1.BlindStructureController.getStructureById);
// Создать структуру (только ADMIN)
router.post('/', BlindStructureController_1.BlindStructureController.createStructure);
// Добавить уровень к структуре (только ADMIN)
router.post('/:id/levels', BlindStructureController_1.BlindStructureController.addLevel);
// Деактивировать структуру (только ADMIN)
router.delete('/:id', BlindStructureController_1.BlindStructureController.deactivateStructure);
exports.default = router;
//# sourceMappingURL=blindStructureRoutes.js.map