"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpServer = exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const financialRoutes_1 = __importDefault(require("./routes/financialRoutes"));
const tournamentRoutes_1 = __importDefault(require("./routes/tournamentRoutes"));
const blindStructureRoutes_1 = __importDefault(require("./routes/blindStructureRoutes"));
const websocket_1 = require("./websocket");
const leaderboardRoutes_1 = __importDefault(require("./routes/leaderboardRoutes"));
const mmrRoutes_1 = __importDefault(require("./routes/mmrRoutes"));
const achievements_1 = __importDefault(require("./routes/achievements"));
const statistics_1 = __importDefault(require("./routes/statistics"));
const menu_1 = __importDefault(require("./routes/menu"));
const orders_1 = __importDefault(require("./routes/orders"));
const clubRoutes_1 = __importDefault(require("./routes/clubRoutes"));
const rewardRoutes_1 = __importDefault(require("./routes/rewardRoutes"));
const billRoutes_1 = __importDefault(require("./routes/billRoutes"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
// Инициализируй WebSocket
exports.io = (0, websocket_1.initializeWebSocket)(httpServer);
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json());
// Routes
app.use('/auth', authRoutes_1.default);
app.use('/user', financialRoutes_1.default);
app.use('/tournaments', tournamentRoutes_1.default);
app.use('/blind-structures', blindStructureRoutes_1.default);
app.use('/leaderboards', leaderboardRoutes_1.default); // ← Добавь
app.use('/mmr', mmrRoutes_1.default);
app.use('/achievements', achievements_1.default); // НОВОЕ
app.use('/statistics', statistics_1.default);
app.use('/menu', menu_1.default);
app.use('/orders', orders_1.default);
app.use('/clubs', clubRoutes_1.default);
app.use('/rewards', rewardRoutes_1.default);
app.use('/bills', billRoutes_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});
// 404 — неизвестный маршрут
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// Глобальный обработчик ошибок (для next(err))
app.use((err, req, res, _next) => {
    const statusCode = err.statusCode ?? 500;
    const isDev = process.env.NODE_ENV !== 'production';
    if (statusCode >= 500) {
        console.error('Server error:', err.message, isDev ? err.stack : '');
    }
    res.status(statusCode).json({
        error: statusCode >= 500 && !isDev ? 'Internal server error' : err.message,
    });
});
//# sourceMappingURL=app.js.map