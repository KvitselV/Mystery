"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authMiddleware = void 0;
const JwtService_1 = require("../services/JwtService");
const jwtService = new JwtService_1.JwtService();
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    const token = authHeader.slice(7); // Удали 'Bearer '
    try {
        const payload = jwtService.verifyAccessToken(token);
        req.user = {
            userId: payload.userId,
            role: payload.role,
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.authMiddleware = authMiddleware;
// Middleware для проверки конкретной роли
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=authMiddleware.js.map