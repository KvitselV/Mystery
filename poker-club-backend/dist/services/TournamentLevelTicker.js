"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTournamentLevelTicker = startTournamentLevelTicker;
const database_1 = require("../config/database");
const Tournament_1 = require("../models/Tournament");
const TournamentLiveState_1 = require("../models/TournamentLiveState");
const typeorm_1 = require("typeorm");
const LiveStateService_1 = require("./LiveStateService");
const LiveTournamentService_1 = require("./LiveTournamentService");
const websocket_1 = require("../websocket");
const redis_1 = require("../config/redis");
const app_1 = require("../app");
const TICK_MS_ACTIVE = 1000; // 1 сек когда есть активные турниры
const TICK_MS_IDLE = 5000; // 5 сек когда нет — меньше нагрузки на БД
const ACTIVE_IDS_CACHE_TTL = 5; // кеш ID активных турниров (сек)
const ACTIVE_IDS_KEY = 'tournament:live:active_ids';
/**
 * Фоновый процесс: каждую секунду уменьшает levelRemainingTimeSeconds в Redis.
 * БД — только при смене уровня и синхронизации. Снижает нагрузку на БД.
 */
function startTournamentLevelTicker() {
    const tournamentRepo = database_1.AppDataSource.getRepository(Tournament_1.Tournament);
    const liveStateRepo = database_1.AppDataSource.getRepository(TournamentLiveState_1.TournamentLiveState);
    const liveStateService = new LiveStateService_1.LiveStateService();
    const liveTournamentService = new LiveTournamentService_1.LiveTournamentService();
    let intervalMs = TICK_MS_IDLE;
    const getActiveTournamentIds = async () => {
        if (redis_1.redisClient.isOpen) {
            try {
                const cached = await redis_1.redisClient.get(ACTIVE_IDS_KEY);
                if (cached) {
                    const ids = JSON.parse(cached);
                    return ids.map((id) => ({ id }));
                }
            }
            catch {
                // ignore parse error, fall through to DB
            }
        }
        const running = await tournamentRepo.find({
            where: { status: (0, typeorm_1.In)(['RUNNING', 'LATE_REG']) },
            select: ['id'],
        });
        if (redis_1.redisClient.isOpen && running.length > 0) {
            try {
                await redis_1.redisClient.set(ACTIVE_IDS_KEY, JSON.stringify(running.map((t) => t.id)), { EX: ACTIVE_IDS_CACHE_TTL });
            }
            catch {
                // ignore
            }
        }
        return running;
    };
    const tick = async () => {
        try {
            const running = await getActiveTournamentIds();
            for (const t of running) {
                try {
                    let timer = await liveStateService.getTimer(t.id);
                    if (!timer) {
                        const liveState = await liveStateRepo.findOne({
                            where: { tournament: { id: t.id } },
                            relations: ['tournament'],
                        });
                        if (!liveState)
                            continue;
                        timer = {
                            levelRemainingTimeSeconds: liveState.levelRemainingTimeSeconds,
                            currentLevelNumber: liveState.currentLevelNumber,
                            isPaused: liveState.isPaused,
                        };
                        await liveStateService.setTimer(t.id, timer);
                    }
                    if (timer.isPaused)
                        continue;
                    const nextRemaining = timer.levelRemainingTimeSeconds - 1;
                    if (nextRemaining <= 0) {
                        try {
                            const { tournament, currentLevel } = await liveTournamentService.moveToNextLevel(t.id);
                            const durationSeconds = (currentLevel?.durationMinutes ?? (currentLevel?.isBreak ? 5 : 20)) * 60;
                            await liveStateService.updateLiveState(t.id, {
                                currentLevelNumber: tournament.currentLevelNumber,
                                levelRemainingTimeSeconds: durationSeconds,
                            });
                            (0, websocket_1.broadcastLevelChange)(app_1.io, t.id, {
                                levelNumber: tournament.currentLevelNumber,
                                durationSeconds,
                            });
                        }
                        catch (err) {
                            console.error(`[Ticker] Advance level failed for tournament ${t.id}:`, err);
                        }
                    }
                    else {
                        const nextTimer = {
                            levelRemainingTimeSeconds: nextRemaining,
                            currentLevelNumber: timer.currentLevelNumber,
                            isPaused: false,
                        };
                        await liveStateService.setTimer(t.id, nextTimer);
                        (0, websocket_1.broadcastTimerTick)(app_1.io, t.id, nextTimer);
                    }
                }
                catch (err) {
                    console.error(`[Ticker] Error for tournament ${t.id}:`, err);
                }
            }
            return running.length;
        }
        catch (err) {
            console.error('[Ticker] Error:', err);
            return 0;
        }
    };
    const schedule = () => {
        tick().then((count) => {
            intervalMs = count > 0 ? TICK_MS_ACTIVE : TICK_MS_IDLE;
            setTimeout(schedule, intervalMs);
        });
    };
    schedule();
}
//# sourceMappingURL=TournamentLevelTicker.js.map