"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Database initialization
database_1.AppDataSource.initialize()
    .then(() => {
    console.log('✅ Database connected');
})
    .catch((err) => {
    console.error('❌ Database connection error:', err);
});
(0, redis_1.connectRedis)().then(() => {
    console.log('✅ Redis connected');
});
// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'OKfsd', timestamp: new Date().toISOString() });
});
app.get('/health1', (req, res) => {
    res.json({ status: 'OKfsd', timestamp: new Date().toISOString() });
});
app.use('/auth', authRoutes_1.default);
// 404 handler для несуществующих маршрутов
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map