"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = require("./config/database");
const app_1 = require("./app");
const redis_1 = require("./config/redis");
const TournamentLevelTicker_1 = require("./services/TournamentLevelTicker");
const TournamentStatusSync_1 = require("./services/TournamentStatusSync");
const tournamentWorker_1 = require("./workers/tournamentWorker");
const PORT = process.env.PORT || 3000;
async function bootstrap() {
    try {
        await database_1.AppDataSource.initialize();
        console.log('✅ Database connected successfully');
        console.log('SERVER BUILD MARKER v3');
        // 👇 Подключаемся к Redis
        await (0, redis_1.connectRedis)();
        // При успешном коннекте у тебя в redis.ts уже есть лог "✅ Redis connected"
        (0, TournamentLevelTicker_1.startTournamentLevelTicker)();
        console.log('⏱️ Tournament level ticker started');
        (0, TournamentStatusSync_1.startTournamentStatusSync)();
        console.log('📅 Tournament status sync started (hourly)');
        (0, tournamentWorker_1.startTournamentWorker)();
        console.log('📦 Tournament job worker started');
        app_1.httpServer.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`🔌 WebSocket ready on ws://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('❌ Startup error:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=server.js.map