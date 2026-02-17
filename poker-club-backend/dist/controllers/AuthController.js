"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const AuthService_1 = require("../services/AuthService");
const authService = new AuthService_1.AuthService();
class AuthController {
    static async register(req, res) {
        try {
            const { name, clubCardNumber, phone, password } = req.body;
            if (!name || !clubCardNumber || !phone || !password) {
                return res.status(400).json({ error: 'Обязательные поля: имя, номер клубной карты, телефон, пароль' });
            }
            const result = await authService.register({
                name,
                clubCardNumber,
                phone,
                password,
            });
            req.session.userId = result.user.id;
            req.session.role = result.user.role;
            await new Promise((res, rej) => req.session.save((err) => (err ? rej(err) : res())));
            res.status(201).json(result);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Registration failed';
            res.status(400).json({ error: message });
        }
    }
    static async login(req, res) {
        try {
            const { phone, password } = req.body;
            if (!phone || !password) {
                return res.status(400).json({ error: 'Phone and password are required' });
            }
            const result = await authService.login({ phone, password });
            req.session.userId = result.user.id;
            req.session.role = result.user.role;
            req.session.managedClubId = result.user.managedClubId ?? null;
            await new Promise((res, rej) => req.session.save((err) => (err ? rej(err) : res())));
            res.json(result);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Login failed';
            res.status(401).json({ error: message });
        }
    }
    static async logout(req, res) {
        req.session.destroy(() => res.json({ ok: true }));
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
            const message = error instanceof Error ? error.message : 'Failed to get user';
            res.status(400).json({ error: message });
        }
    }
    static async updateProfile(req, res) {
        try {
            if (!req.user)
                return res.status(401).json({ error: 'Unauthorized' });
            const { name, phone, avatarUrl } = req.body;
            const user = await authService.updateProfile(req.user.userId, {
                ...(name != null && { name }),
                ...(phone != null && { phone }),
                ...('avatarUrl' in req.body && { avatarUrl: avatarUrl ?? null }),
            });
            res.json(user);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update profile';
            res.status(400).json({ error: message });
        }
    }
    static async promoteToAdmin(req, res) {
        try {
            if (!req.user)
                return res.status(401).json({ error: 'Unauthorized' });
            const result = await authService.promoteToAdmin(req.user.userId);
            if (!result)
                return res.status(403).json({ error: 'Promotion not allowed' });
            req.session.role = 'ADMIN';
            await new Promise((res, rej) => req.session.save((err) => (err ? rej(err) : res())));
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
        }
    }
    static async assignControllerToClub(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN')
                return res.status(403).json({ error: 'Admin only' });
            const { userId, clubId } = req.body;
            if (!userId || !clubId)
                return res.status(400).json({ error: 'userId and clubId required' });
            const result = await authService.assignControllerToClub(userId, clubId);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
        }
    }
    static async getUsers(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN')
                return res.status(403).json({ error: 'Admin only' });
            const users = await authService.getAllUsers();
            res.json({ users });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
        }
    }
    static async promoteToController(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN')
                return res.status(403).json({ error: 'Admin only' });
            const { userId, clubId } = req.body;
            if (!userId || !clubId)
                return res.status(400).json({ error: 'userId and clubId required' });
            const result = await authService.promoteToController(req.user.userId, userId, clubId);
            if (!result)
                return res.status(400).json({ error: 'Promotion failed' });
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map