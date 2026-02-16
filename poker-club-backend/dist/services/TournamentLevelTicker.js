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
const app_1 = require("../app");
/**
 * Фоновый процесс: каждую секунду уменьшает levelRemainingTimeSeconds
 * для активных турниров. При достижении 0 — автоматический переход на следующий уровень.
 */
function startTournamentLevelTicker() {
    const tournamentRepo = database_1.AppDataSource.getRepository(Tournament_1.Tournament);
    const liveStateRepo = database_1.AppDataSource.getRepository(TournamentLiveState_1.TournamentLiveState);
    const liveStateService = new LiveStateService_1.LiveStateService();
    const liveTournamentService = new LiveTournamentService_1.LiveTournamentService();
    setInterval(async () => {
        try {
            const running = await tournamentRepo.find({
                where: { status: (0, typeorm_1.In)(['RUNNING', 'LATE_REG']) },
                select: ['id'],
            });
            for (const t of running) {
                try {
                    const liveState = await liveStateRepo.findOne({
                        where: { tournament: { id: t.id } },
                        relations: ['tournament'],
                    });
                    if (!liveState || liveState.isPaused)
                        continue;
                    const nextRemaining = liveState.levelRemainingTimeSeconds - 1;
                    if (nextRemaining <= 0) {
                        // Переход на следующий уровень
                        try {
                            const { tournament, currentLevel } = await liveTournamentService.moveToNextLevel(t.id);
                            const durationSeconds = currentLevel?.isBreak
                                ? 300
                                : (currentLevel?.durationMinutes ?? 20) * 60;
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
                        await liveStateService.updateLiveState(t.id, {
                            levelRemainingTimeSeconds: nextRemaining,
                        });
                    }
                }
                catch (err) {
                    console.error(`[Ticker] Error for tournament ${t.id}:`, err);
                }
            }
        }
        catch (err) {
            console.error('[Ticker] Error:', err);
        }
    }, 1000);
}
//# sourceMappingURL=TournamentLevelTicker.js.map