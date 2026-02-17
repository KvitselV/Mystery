"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveStateService = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const TournamentLiveState_1 = require("../models/TournamentLiveState");
const Tournament_1 = require("../models/Tournament");
const TableSeat_1 = require("../models/TableSeat");
const TournamentRegistration_1 = require("../models/TournamentRegistration");
const PlayerOperation_1 = require("../models/PlayerOperation");
const app_1 = require("../app");
const websocket_1 = require("../websocket");
class LiveStateService {
    constructor() {
        this.liveStateRepository = database_1.AppDataSource.getRepository(TournamentLiveState_1.TournamentLiveState);
        this.tournamentRepository = database_1.AppDataSource.getRepository(Tournament_1.Tournament);
        this.seatRepository = database_1.AppDataSource.getRepository(TableSeat_1.TableSeat);
        this.registrationRepository = database_1.AppDataSource.getRepository(TournamentRegistration_1.TournamentRegistration);
        this.operationRepository = database_1.AppDataSource.getRepository(PlayerOperation_1.PlayerOperation);
    }
    // ---------- Redis helpers ----------
    getLiveStateKey(tournamentId) {
        return `tournament:live:${tournamentId}`;
    }
    getTimerKey(tournamentId) {
        return `tournament:live:timer:${tournamentId}`;
    }
    /** Таймер в Redis — источник истины для тикера, снижает нагрузку на БД */
    async getTimer(tournamentId) {
        if (!redis_1.redisClient.isOpen)
            return null;
        const raw = await redis_1.redisClient.get(this.getTimerKey(tournamentId));
        if (!raw)
            return null;
        try {
            return JSON.parse(raw);
        }
        catch {
            return null;
        }
    }
    async setTimer(tournamentId, data) {
        if (!redis_1.redisClient.isOpen)
            return;
        await redis_1.redisClient.set(this.getTimerKey(tournamentId), JSON.stringify(data), { EX: 86400 });
    }
    async getFromCache(tournamentId) {
        if (!redis_1.redisClient.isOpen)
            return null;
        const key = this.getLiveStateKey(tournamentId);
        const raw = await redis_1.redisClient.get(key);
        if (!raw)
            return null;
        try {
            return JSON.parse(raw);
        }
        catch {
            return null;
        }
    }
    async saveToCache(tournamentId, dto) {
        if (!redis_1.redisClient.isOpen)
            return;
        const key = this.getLiveStateKey(tournamentId);
        await redis_1.redisClient.set(key, JSON.stringify(dto), {
            EX: 60, // TTL: 60 сек, можешь поменять на 300
        });
    }
    async deleteFromCache(tournamentId) {
        if (!redis_1.redisClient.isOpen)
            return;
        await redis_1.redisClient.del(this.getLiveStateKey(tournamentId));
    }
    // ---------- Основная логика ----------
    /**
     * Создать или получить Live State для турнира
     * + попробовать взять DTO из Redis
     */
    async getOrCreateLiveState(tournamentId) {
        // NOTE: этот метод по-прежнему возвращает entity, но
        // кэшируем мы уже форматированный DTO в местах обновления
        let liveState = await this.liveStateRepository.findOne({
            where: { tournament: { id: tournamentId } },
            relations: ['tournament'],
        });
        if (!liveState) {
            const tournament = await this.tournamentRepository.findOne({
                where: { id: tournamentId },
            });
            if (!tournament) {
                throw new Error('Tournament not found');
            }
            liveState = this.liveStateRepository.create({
                tournament,
                currentLevelNumber: tournament.currentLevelNumber || 1,
                levelRemainingTimeSeconds: 1200,
                playersCount: 0,
                totalParticipants: 0,
                totalEntries: 0,
                totalChipsInPlay: 0,
                averageStack: tournament.startingStack,
                isPaused: false,
                liveStatus: 'RUNNING',
            });
            await this.liveStateRepository.save(liveState);
            await this.setTimer(tournamentId, {
                levelRemainingTimeSeconds: liveState.levelRemainingTimeSeconds,
                currentLevelNumber: liveState.currentLevelNumber,
                isPaused: liveState.isPaused,
            });
            console.log(`✅ Created Live State for tournament: ${tournamentId}`);
        }
        return liveState;
    }
    /**
     * Обновить Live State
     * + обновить Redis + отправить WebSocket
     */
    async updateLiveState(tournamentId, updates) {
        const liveState = await this.getOrCreateLiveState(tournamentId);
        Object.assign(liveState, updates);
        liveState.updatedAt = new Date();
        const updated = await this.liveStateRepository.save(liveState);
        let timerMerged = null;
        if (updates.levelRemainingTimeSeconds !== undefined || updates.currentLevelNumber !== undefined || updates.isPaused !== undefined) {
            const existing = await this.getTimer(tournamentId);
            timerMerged = {
                levelRemainingTimeSeconds: updates.levelRemainingTimeSeconds ?? existing?.levelRemainingTimeSeconds ?? updated.levelRemainingTimeSeconds,
                currentLevelNumber: updates.currentLevelNumber ?? existing?.currentLevelNumber ?? updated.currentLevelNumber,
                isPaused: updates.isPaused ?? existing?.isPaused ?? updated.isPaused,
            };
            await this.setTimer(tournamentId, timerMerged);
        }
        const dto = this.formatLiveState(updated);
        if (timerMerged) {
            dto.levelRemainingTimeSeconds = timerMerged.levelRemainingTimeSeconds;
            dto.currentLevelNumber = timerMerged.currentLevelNumber;
            dto.isPaused = timerMerged.isPaused;
        }
        await this.saveToCache(tournamentId, dto); // 👈 кэш
        (0, websocket_1.broadcastLiveStateUpdate)(app_1.io, tournamentId, dto); // 🔥 вебсокет
        return updated;
    }
    /**
     * Пересчитать статистику: активные участники, всего участников, входы, фишки в игре, средний стек
     */
    async recalculateStats(tournamentId) {
        const liveState = await this.getOrCreateLiveState(tournamentId);
        const activeSeats = await this.seatRepository.find({
            where: {
                table: { tournament: { id: tournamentId } },
                isOccupied: true,
                status: 'ACTIVE',
            },
            relations: ['player'],
        });
        const activePlayerIds = [...new Set(activeSeats.map((s) => s.player?.id).filter(Boolean))];
        const totalParticipants = await this.registrationRepository.count({
            where: { tournament: { id: tournamentId } },
        });
        const [rebuyCount, addonCount] = await Promise.all([
            this.operationRepository.count({
                where: { tournament: { id: tournamentId }, operationType: 'REBUY' },
            }),
            this.operationRepository.count({
                where: { tournament: { id: tournamentId }, operationType: 'ADDON' },
            }),
        ]);
        const totalEntries = totalParticipants + rebuyCount;
        // Общее количество фишек = бай-ины + ребаи + аддоны. Не уменьшается при вылете — вылетевший отдал фишки победителю.
        const startingStack = liveState.tournament?.startingStack ?? 0;
        const rebuyChips = liveState.tournament?.rebuyChips ?? 0;
        const addonChips = liveState.tournament?.addonChips ?? 0;
        const totalChipsInPlay = totalParticipants * startingStack + rebuyCount * rebuyChips + addonCount * addonChips;
        const playersCount = activePlayerIds.length;
        const divisor = playersCount > 0 ? playersCount : totalParticipants;
        const averageStack = divisor > 0 ? Math.floor(totalChipsInPlay / divisor) : (liveState.tournament?.startingStack ?? 0);
        liveState.playersCount = playersCount;
        liveState.totalParticipants = totalParticipants;
        liveState.totalEntries = totalEntries;
        liveState.totalChipsInPlay = totalChipsInPlay;
        liveState.averageStack = averageStack;
        liveState.updatedAt = new Date();
        const updated = await this.liveStateRepository.save(liveState);
        const dto = this.formatLiveState(updated);
        await this.saveToCache(tournamentId, dto);
        (0, websocket_1.broadcastLiveStateUpdate)(app_1.io, tournamentId, dto);
        return updated;
    }
    async pauseTournament(tournamentId) {
        const updated = await this.updateLiveState(tournamentId, {
            isPaused: true,
            liveStatus: 'PAUSED',
        });
        console.log(`⏸️ Tournament ${tournamentId} paused`);
        return updated;
    }
    async resumeTournament(tournamentId) {
        const updated = await this.updateLiveState(tournamentId, {
            isPaused: false,
            liveStatus: 'RUNNING',
        });
        console.log(`▶️ Tournament ${tournamentId} resumed`);
        return updated;
    }
    async updateLevelTime(tournamentId, remainingSeconds) {
        const updated = await this.updateLiveState(tournamentId, {
            levelRemainingTimeSeconds: remainingSeconds,
        });
        console.log(`⏱️ Level time updated for tournament ${tournamentId}: ${remainingSeconds}s`);
        return updated;
    }
    async advanceToNextLevel(tournamentId) {
        const liveState = await this.getOrCreateLiveState(tournamentId);
        const nextLevel = liveState.currentLevelNumber + 1;
        const updated = await this.updateLiveState(tournamentId, {
            currentLevelNumber: nextLevel,
            levelRemainingTimeSeconds: 1200,
        });
        (0, websocket_1.broadcastLevelChange)(app_1.io, tournamentId, {
            levelNumber: nextLevel,
            durationSeconds: 1200,
        });
        console.log(`🆙 Advanced to level ${nextLevel} in tournament ${tournamentId}`);
        return updated;
    }
    /**
     * Получить Live State
     * ⚠️ Важно: для API лучше отдавать DTO и сначала пробовать Redis
     */
    async getLiveState(tournamentId) {
        // 1. Сначала пробуем DTO из Redis
        const cached = await this.getFromCache(tournamentId);
        if (cached) {
            return cached;
        }
        // 2. Если нет в кэше — читаем из БД и кладём
        const liveState = await this.liveStateRepository.findOne({
            where: { tournament: { id: tournamentId } },
            relations: ['tournament'],
        });
        if (!liveState)
            return null;
        const dto = this.formatLiveState(liveState);
        await this.saveToCache(tournamentId, dto);
        return dto;
    }
    /**
     * Удалить Live State (при завершении турнира)
     */
    async getRebuyAndAddonCounts(tournamentId) {
        const [rebuyCount, addonCount] = await Promise.all([
            this.operationRepository.count({
                where: { tournament: { id: tournamentId }, operationType: 'REBUY' },
            }),
            this.operationRepository.count({
                where: { tournament: { id: tournamentId }, operationType: 'ADDON' },
            }),
        ]);
        return { rebuyCount, addonCount };
    }
    async deleteLiveState(tournamentId) {
        const liveState = await this.liveStateRepository.findOne({
            where: { tournament: { id: tournamentId } },
        });
        if (liveState) {
            await this.liveStateRepository.remove(liveState);
            console.log(`🗑️ Deleted Live State for tournament ${tournamentId}`);
        }
        await this.deleteFromCache(tournamentId);
        if (redis_1.redisClient.isOpen)
            await redis_1.redisClient.del(this.getTimerKey(tournamentId));
    }
    /**
     * Форматировать Live State для ответа и WebSocket
     */
    formatLiveState(liveState) {
        return {
            tournamentId: liveState.tournament.id,
            tournamentName: liveState.tournament.name,
            currentLevelNumber: liveState.currentLevelNumber,
            levelRemainingTimeSeconds: liveState.levelRemainingTimeSeconds,
            playersCount: liveState.playersCount,
            totalParticipants: liveState.totalParticipants,
            totalEntries: liveState.totalEntries,
            totalChipsInPlay: liveState.totalChipsInPlay,
            averageStack: liveState.averageStack,
            isPaused: liveState.isPaused,
            liveStatus: liveState.liveStatus,
            nextBreakTime: liveState.nextBreakTime ?? null,
            updatedAt: liveState.updatedAt,
        };
    }
}
exports.LiveStateService = LiveStateService;
//# sourceMappingURL=LiveStateService.js.map