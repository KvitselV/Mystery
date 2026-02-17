"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireAdminOrController = exports.requireRole = exports.authMiddleware = void 0;
const database_1 = require("../config/database");
const User_1 = require("../models/User");
const userRepository = database_1.AppDataSource.getRepository(User_1.User);
const authMiddleware = async (req, res, next) => {
    const sid = req.session?.userId;
    if (!sid) {
        return res.status(401).json({ error: 'Unauthorized: no session' });
    }
    req.user = {
        userId: req.session.userId,
        role: req.session.role,
        managedClubId: req.session.managedClubId ?? null,
    };
    if (req.user.role === 'CONTROLLER') {
        const u = await userRepository.findOne({ where: { id: req.user.userId }, select: ['managedClubId'] });
        req.user.managedClubId = u?.managedClubId ?? null;
    }
    next();
};
exports.authMiddleware = authMiddleware;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!roles.includes(req.user.role))
            return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
        next();
    };
};
exports.requireRole = requireRole;
/** ADMIN — полный доступ. CONTROLLER — доступ только к своему клубу (managedClubId обязателен) */
const requireAdminOrController = () => {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        if (req.user.role === 'ADMIN')
            return next();
        if (req.user.role === 'CONTROLLER') {
            if (!req.user.managedClubId)
                return res.status(403).json({ error: 'Controller must be assigned to a club' });
            return next();
        }
        return res.status(403).json({ error: 'Forbidden: admin or controller required' });
    };
};
exports.requireAdminOrController = requireAdminOrController;
/** Только ADMIN — управление клубами и глобальные настройки */
const requireAdmin = () => {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        if (req.user.role !== 'ADMIN')
            return res.status(403).json({ error: 'Forbidden: admin required' });
        next();
    };
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=authMiddleware.js.map