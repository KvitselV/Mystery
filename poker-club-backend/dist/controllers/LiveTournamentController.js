"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveTournamentController = void 0;
const LiveTournamentService_1 = require("../services/LiveTournamentService");
const liveTournamentService = new LiveTournamentService_1.LiveTournamentService();
class LiveTournamentController {
    static async rebuy(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const tournamentId = req.params.id;
            const playerId = req.params.playerId;
            const { amount } = req.body;
            const operation = await liveTournamentService.rebuy(tournamentId, playerId, amount);
            res.json({
                message: 'Rebuy successful',
                operation: {
                    id: operation.id,
                    type: operation.operationType,
                    amount: operation.amount,
                    createdAt: operation.createdAt,
                },
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    static async addon(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const tournamentId = req.params.id;
            const playerId = req.params.playerId;
            const { amount } = req.body;
            if (!amount) {
                return res.status(400).json({ error: 'amount is required' });
            }
            const operation = await liveTournamentService.addon(tournamentId, playerId, amount);
            res.json({
                message: 'Addon successful',
                operation: {
                    id: operation.id,
                    type: operation.operationType,
                    amount: operation.amount,
                    createdAt: operation.createdAt,
                },
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * POST /tournaments/:id/player/:playerId/eliminate - Выбытие игрока
     * Только для администраторов
     */
    static async eliminatePlayer(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const tournamentId = req.params.id;
            const playerId = req.params.playerId;
            const { finishPosition } = req.body;
            if (!finishPosition) {
                return res.status(400).json({ error: 'finishPosition is required' });
            }
            const result = await liveTournamentService.eliminatePlayer(tournamentId, playerId, finishPosition);
            res.json({
                message: 'Player eliminated',
                result: {
                    id: result.id,
                    finishPosition: result.finishPosition,
                    isFinalTable: result.isFinalTable,
                },
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * PATCH /tournaments/:id/level/next - Перейти на следующий уровень
     * Только для администраторов
     */
    static async moveToNextLevel(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const tournamentId = req.params.id;
            const { tournament, currentLevel } = await liveTournamentService.moveToNextLevel(tournamentId);
            res.json({
                message: 'Moved to next level',
                tournament: {
                    id: tournament.id,
                    name: tournament.name,
                    currentLevelNumber: tournament.currentLevelNumber,
                },
                currentLevel: currentLevel
                    ? {
                        levelNumber: currentLevel.levelNumber,
                        smallBlind: currentLevel.smallBlind,
                        bigBlind: currentLevel.bigBlind,
                        ante: currentLevel.ante,
                        durationMinutes: currentLevel.durationMinutes,
                        isBreak: currentLevel.isBreak,
                        breakName: currentLevel.breakName,
                    }
                    : null,
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * GET /tournaments/:id/level/current - Получить текущий уровень
     */
    static async getCurrentLevel(req, res) {
        try {
            const tournamentId = req.params.id;
            const currentLevel = await liveTournamentService.getCurrentLevel(tournamentId);
            if (!currentLevel) {
                return res.status(404).json({ error: 'No current level found' });
            }
            res.json({
                currentLevel: {
                    levelNumber: currentLevel.levelNumber,
                    smallBlind: currentLevel.smallBlind,
                    bigBlind: currentLevel.bigBlind,
                    ante: currentLevel.ante,
                    durationMinutes: currentLevel.durationMinutes,
                    isBreak: currentLevel.isBreak,
                    breakName: currentLevel.breakName,
                },
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * GET /tournaments/:id/player/:playerId/operations - История операций игрока
     */
    static async getPlayerOperations(req, res) {
        try {
            const playerId = req.params.playerId;
            const operations = await liveTournamentService.getPlayerOperationsInTournament(playerId);
            res.json({
                operations: operations.map((op) => ({
                    id: op.id,
                    type: op.operationType,
                    amount: op.amount,
                    createdAt: op.createdAt,
                })),
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * POST /tournaments/:id/finish - Завершить турнир
     * Только для администраторов
     */
    static async finishTournament(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const tournamentId = req.params.id;
            await liveTournamentService.finishTournament(tournamentId);
            res.json({
                message: 'Tournament finished successfully',
                tournamentId,
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
}
exports.LiveTournamentController = LiveTournamentController;
//# sourceMappingURL=LiveTournamentController.js.map