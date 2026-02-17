"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionMiddleware = exports.sessionStore = exports.sessionSecret = void 0;
const express_session_1 = __importDefault(require("express-session"));
const connect_redis_1 = require("connect-redis");
const redis_1 = require("./redis");
exports.sessionSecret = process.env.SESSION_SECRET || 'poker-club-secret-change-in-production';
const redisStore = new connect_redis_1.RedisStore({ client: redis_1.redisClient, prefix: 'poker:sess:' });
exports.sessionStore = redisStore;
exports.sessionMiddleware = (0, express_session_1.default)({
    store: redisStore,
    secret: exports.sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: 'poker.sid',
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
        sameSite: 'lax',
    },
});
//# sourceMappingURL=session.js.map