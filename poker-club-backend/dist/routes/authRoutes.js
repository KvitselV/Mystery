"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Публичные маршруты
router.post('/register', AuthController_1.AuthController.register);
router.post('/login', AuthController_1.AuthController.login);
router.post('/refresh', AuthController_1.AuthController.refresh);
// Защищённые маршруты
router.get('/me', authMiddleware_1.authMiddleware, AuthController_1.AuthController.getMe);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map