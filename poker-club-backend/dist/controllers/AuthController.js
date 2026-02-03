"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const AuthService_1 = require("../services/AuthService");
const authService = new AuthService_1.AuthService();
class AuthController {
    static async register(req, res) {
        try {
            const { firstName, lastName, phone, email, password } = req.body;
            // Базовая валидация
            if (!firstName || !lastName || !phone || !password) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            const result = await authService.register({
                firstName,
                lastName,
                phone,
                email,
                password,
            });
            res.status(201).json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async login(req, res) {
        try {
            const { phone, password } = req.body;
            if (!phone || !password) {
                return res.status(400).json({ error: 'Phone and password are required' });
            }
            const result = await authService.login({ phone, password });
            res.json(result);
        }
        catch (error) {
            res.status(401).json({ error: error.message });
        }
    }
    static async refresh(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({ error: 'Refresh token is required' });
            }
            const result = await authService.refreshAccessToken(refreshToken);
            res.json(result);
        }
        catch (error) {
            res.status(401).json({ error: error.message });
        }
    }
    static async getMe(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const user = await authService.getUserById(req.user.userId);
            res.json(user);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map