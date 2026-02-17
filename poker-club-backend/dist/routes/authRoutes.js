"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Публичные маршруты
router.post('/register', AuthController_1.AuthController.register);
router.post('/login', AuthController_1.AuthController.login);
router.post('/logout', AuthController_1.AuthController.logout);
// Защищённые маршруты
router.get('/me', authMiddleware_1.authMiddleware, AuthController_1.AuthController.getMe);
router.patch('/me', authMiddleware_1.authMiddleware, AuthController_1.AuthController.updateProfile);
router.post('/promote-me', authMiddleware_1.authMiddleware, AuthController_1.AuthController.promoteToAdmin);
router.get('/users', authMiddleware_1.authMiddleware, (0, authMiddleware_1.requireAdmin)(), AuthController_1.AuthController.getUsers);
router.post('/assign-controller', authMiddleware_1.authMiddleware, (0, authMiddleware_1.requireAdmin)(), AuthController_1.AuthController.assignControllerToClub);
router.post('/promote-controller', authMiddleware_1.authMiddleware, (0, authMiddleware_1.requireAdmin)(), AuthController_1.AuthController.promoteToController);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map