"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveStateController = void 0;
const database_1 = require("../config/database");
const LiveStateService_1 = require("../services/LiveStateService");
const TournamentService_1 = require("../services/TournamentService");
const BlindStructure_1 = require("../models/BlindStructure");
const liveStateService = new LiveStateService_1.LiveStateService();
const tournamentService = new TournamentService_1.TournamentService();
/** Текущий и следующий уровень по массиву уровней */
function getCurrentAndNextLevel(levels, currentLevelNumber) {
    const sorted = [...levels].sort((a, b) => (a.levelNumber ?? 0) - (b.levelNumber ?? 0));
    const currentLevel = sorted.find((l) => l.levelNumber === currentLevelNumber) ?? null;
    const nextLevel = sorted.find((l) => l.levelNumber === currentLevelNumber + 1) ?? null;
    return { currentLevel, nextLevel };
}
/**
 * База секунд до перерыва: сумма длительностей уровней между текущим и перерывом.
 * Фронтенд добавит актуальный таймер уровня.
 */
function computeNextBreakBaseSeconds(levels, currentLevelNumber, currentLevelIsBreak) {
    const sorted = [...levels].sort((a, b) => (a.levelNumber ?? 0) - (b.levelNumber ?? 0));
    if (currentLevelIsBreak)
        return 0;
    const nextBreak = sorted.find((l) => !!l.isBreak && (l.levelNumber ?? 0) > currentLevelNumber);
    if (!nextBreak)
        return null;
    let baseSec = 0;
    for (const l of sorted) {
        const ln = l.levelNumber ?? 0;
        if (ln <= currentLevelNumber)
            continue;
        if (ln >= (nextBreak.levelNumber ?? 0))
            break;
        baseSec += (l.durationMinutes ?? 0) * 60;
    }
    return baseSec;
}
/**
 * База секунд до конца поздней регистрации: сумма длительностей уровней до перерыва END_LATE_REG.
 */
function computeLateRegBaseSeconds(levels, currentLevelNumber) {
    const sorted = [...levels].sort((a, b) => (a.levelNumber ?? 0) - (b.levelNumber ?? 0));
    const lateRegBreak = sorted.find((l) => !!l.isBreak && ((l.breakType ?? '').toUpperCase().includes('END_LATE_REG')));
    if (!lateRegBreak)
        return null;
    const breakLn = lateRegBreak.levelNumber ?? 0;
    if (currentLevelNumber >= breakLn)
        return null;
    let baseSec = 0;
    for (const l of sorted) {
        const ln = l.levelNumber ?? 0;
        if (ln <= currentLevelNumber)
            continue;
        if (ln >= breakLn)
            break;
        baseSec += (l.durationMinutes ?? 0) * 60;
    }
    return baseSec;
}
class LiveStateController {
    /**
     * GET /tournaments/:id/live - Получить Live State турнира
     */
    static async getLiveState(req, res) {
        try {
            const tournamentId = req.params.id;
            const [liveState, tournamentForLive, redisTimer] = await Promise.all([
                liveStateService.getOrCreateLiveState(tournamentId),
                tournamentService.getTournamentForLive(tournamentId),
                liveStateService.getTimer(tournamentId),
            ]);
            if (!liveState) {
                return res.status(404).json({ error: 'Live state not found' });
            }
            const currentLevelNumber = redisTimer?.currentLevelNumber ?? liveState.currentLevelNumber;
            const levelRemainingTimeSeconds = redisTimer?.levelRemainingTimeSeconds ?? liveState.levelRemainingTimeSeconds;
            const isPaused = redisTimer?.isPaused ?? liveState.isPaused;
            let levels = tournamentForLive?.blindStructure?.levels ?? [];
            if (levels.length === 0 && tournamentForLive?.blindStructureId) {
                const structure = await database_1.AppDataSource.getRepository(BlindStructure_1.BlindStructure).findOne({
                    where: { id: tournamentForLive.blindStructureId },
                    relations: ['levels'],
                });
                levels = structure?.levels ?? [];
            }
            const { currentLevel, nextLevel } = getCurrentAndNextLevel(levels, currentLevelNumber);
            const currentLevelIsBreak = !!(currentLevel?.isBreak ?? false);
            const nextBreakBase = levels.length > 0
                ? computeNextBreakBaseSeconds(levels, currentLevelNumber, currentLevelIsBreak)
                : (currentLevelIsBreak ? 0 : null);
            const lateRegBase = levels.length > 0
                ? computeLateRegBaseSeconds(levels, currentLevelNumber)
                : null;
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
            res.set('Pragma', 'no-cache');
            res.json({
                liveState: {
                    tournamentId: liveState.tournament.id,
                    tournamentName: liveState.tournament.name,
                    currentLevelNumber,
                    levelRemainingTimeSeconds,
                    playersCount: liveState.playersCount,
                    averageStack: liveState.averageStack,
                    totalChipsInPlay: liveState.totalChipsInPlay,
                    isPaused,
                    liveStatus: liveState.liveStatus,
                    nextBreakBaseSeconds: nextBreakBase,
                    lateRegBaseSeconds: lateRegBase,
                    tournamentStatus: tournamentForLive?.status ?? liveState.liveStatus,
                    updatedAt: liveState.updatedAt,
                    entriesCount: liveState.totalEntries || liveState.totalParticipants || liveState.playersCount,
                    totalParticipants: liveState.totalParticipants ?? liveState.playersCount,
                    currentLevel: currentLevel
                        ? {
                            smallBlind: currentLevel.smallBlind,
                            bigBlind: currentLevel.bigBlind,
                            ante: currentLevel.ante ?? 0,
                            isBreak: currentLevel.isBreak ?? false,
                            breakType: currentLevel.breakType ?? null,
                            breakName: currentLevel.breakName ?? null,
                        }
                        : null,
                    nextLevel: nextLevel
                        ? {
                            smallBlind: nextLevel.smallBlind,
                            bigBlind: nextLevel.bigBlind,
                            ante: nextLevel.ante ?? 0,
                        }
                        : null,
                    tournament: {
                        startingStack: liveState.tournament.startingStack,
                        rebuyChips: liveState.tournament.rebuyChips ?? 0,
                        addonChips: liveState.tournament.addonChips ?? 0,
                        maxRebuys: liveState.tournament.maxRebuys ?? 0,
                        maxAddons: liveState.tournament.maxAddons ?? 0,
                    },
                },
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * PATCH /tournaments/:id/pause - Поставить турнир на паузу
     * Только для администраторов
     */
    static async pauseTournament(req, res) {
        try {
            const tournamentId = req.params.id;
            const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
            await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);
            const liveState = await liveStateService.pauseTournament(tournamentId);
            res.json({
                message: 'Tournament paused',
                liveState: {
                    tournamentId: liveState.tournament.id,
                    isPaused: liveState.isPaused,
                    liveStatus: liveState.liveStatus,
                },
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * PATCH /tournaments/:id/resume - Возобновить турнир
     * Только для администраторов
     */
    static async resumeTournament(req, res) {
        try {
            const tournamentId = req.params.id;
            const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
            await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);
            const liveState = await liveStateService.resumeTournament(tournamentId);
            res.json({
                message: 'Tournament resumed',
                liveState: {
                    tournamentId: liveState.tournament.id,
                    isPaused: liveState.isPaused,
                    liveStatus: liveState.liveStatus,
                },
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * PATCH /tournaments/:id/live/recalculate - Пересчитать статистику
     * Только для администраторов
     */
    static async recalculateStats(req, res) {
        try {
            const tournamentId = req.params.id;
            const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
            await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);
            const liveState = await liveStateService.recalculateStats(tournamentId);
            res.json({
                message: 'Stats recalculated',
                liveState: {
                    tournamentId: liveState.tournament.id,
                    playersCount: liveState.playersCount,
                    averageStack: liveState.averageStack,
                },
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * PATCH /tournaments/:id/live/time - Обновить оставшееся время
     * Только для администраторов
     */
    static async updateLevelTime(req, res) {
        try {
            const tournamentId = req.params.id;
            const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
            await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);
            const { remainingSeconds } = req.body;
            if (remainingSeconds === undefined) {
                return res.status(400).json({ error: 'remainingSeconds is required' });
            }
            const liveState = await liveStateService.updateLevelTime(tournamentId, remainingSeconds);
            res.json({
                message: 'Level time updated',
                liveState: {
                    tournamentId: liveState.tournament.id,
                    levelRemainingTimeSeconds: liveState.levelRemainingTimeSeconds,
                },
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
}
exports.LiveStateController = LiveStateController;
//# sourceMappingURL=LiveStateController.js.map