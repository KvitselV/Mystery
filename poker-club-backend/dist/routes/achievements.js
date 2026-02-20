"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AchievementController_1 = require("../controllers/AchievementController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Публичное чтение типов достижений
router.get('/types', AchievementController_1.AchievementController.getAllTypes);
// Остальное — только для авторизованных
router.use(authMiddleware_1.authMiddleware);
// Доступ к достижениям пользователя: только свой userId или ADMIN
router.get('/user/:userId', AchievementController_1.AchievementController.getUserAchievements);
router.get('/user/:userId/progress', AchievementController_1.AchievementController.getUserProgress);
// Только ADMIN
router.post('/check/:userId/:tournamentId', (0, authMiddleware_1.requireRole)(['ADMIN']), AchievementController_1.AchievementController.checkAchievements);
router.post('/seed', (0, authMiddleware_1.requireRole)(['ADMIN']), AchievementController_1.AchievementController.seedTypes);
router.post('/types', (0, authMiddleware_1.requireRole)(['ADMIN']), AchievementController_1.AchievementController.createType);
router.delete('/instances/:id', (0, authMiddleware_1.requireRole)(['ADMIN']), AchievementController_1.AchievementController.revokeInstance);
// Закреплённые достижения (свой userId или ADMIN)
router.patch('/user/:userId/pins', AchievementController_1.AchievementController.setPins);
// Получить достижения по playerProfileId (доступно всем авторизованным)
router.get('/profile/:playerProfileId', AchievementController_1.AchievementController.getAchievementsByPlayerProfileId);
exports.default = router;
//# sourceMappingURL=achievements.js.map