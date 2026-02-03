"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class JwtService {
    constructor() {
        this.accessTokenSecret = process.env.JWT_SECRET || 'your-secret-key';
        this.refreshTokenSecret = process.env.JWT_SECRET + '_refresh' || 'refresh-secret-key';
    }
    generateAccessToken(userId, role) {
        return jsonwebtoken_1.default.sign({ userId, role }, this.accessTokenSecret, { expiresIn: '7d' });
    }
    generateRefreshToken(userId) {
        return jsonwebtoken_1.default.sign({ userId }, this.refreshTokenSecret, { expiresIn: '30d' });
    }
    verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.accessTokenSecret);
        }
        catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
    verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.refreshTokenSecret);
        }
        catch (error) {
            throw new Error('Invalid or expired refresh token');
        }
    }
}
exports.JwtService = JwtService;
//# sourceMappingURL=JwtService.js.map