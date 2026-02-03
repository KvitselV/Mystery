"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
exports.connectRedis = connectRedis;
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.redisClient = (0, redis_1.createClient)({
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    password: process.env.REDIS_PASSWORD,
});
exports.redisClient.on('error', (err) => console.log('Redis Client Error', err));
exports.redisClient.on('connect', () => console.log('✅ Redis connected'));
async function connectRedis() {
    if (!exports.redisClient.isOpen) {
        await exports.redisClient.connect();
    }
}
//# sourceMappingURL=redis.js.map