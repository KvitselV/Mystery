"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveTournamentController = void 0;
const LiveTournamentService_1 = require("../services/LiveTournamentService");
const LiveStateService_1 = require("../services/LiveStateService");
const TournamentService_1 = require("../services/TournamentService");
const TournamentBalanceService_1 = require("../services/TournamentBalanceService");
const BillService_1 = require("../services/BillService");
const PlayerBill_1 = require("../models/PlayerBill");
const liveTournamentService = new LiveTournamentService_1.LiveTournamentService();
const billService = new BillService_1.BillService();
const tournamentBalanceService = new TournamentBalanceService_1.TournamentBalanceService();
const liveStateService = new LiveStateService_1.LiveStateService();
const tournamentService = new TournamentService_1.TournamentService();
class LiveTournamentController {
    static async rebuy(req, res) {
        try {
            const tournamentId = req.params.id;
            const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
            await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);
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
            const tournamentId = req.params.id;
            const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
            await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);
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
    static async eliminatePlayer(req, res) {
        try {
            const tournamentId = req.params.id;
            const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
            await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);
            const playerId = req.params.playerId;
            const { finishPosition } = req.body;
            const result = await liveTournamentService.eliminatePlayer(tournamentId, playerId, typeof finishPosition === 'number' && finishPosition >= 1 ? finishPosition : undefined);
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
    static async returnEliminatedPlayer(req, res) {
        try {
            const tournamentId = req.params.id;
            const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
            await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);
            const playerId = req.params.playerId;
            const { tableId, seatNumber } = req.body;
            if (!tableId || typeof seatNumber !== 'number' || seatNumber < 1) {
                return res.status(400).json({ error: 'tableId и seatNumber обязательны' });
            }
            const result = await liveTournamentService.returnEliminatedPlayer(tournamentId, playerId, tableId, seatNumber);
            res.json(result);
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
            const tournamentId = req.params.id;
            const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
            await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);
            const { tournament, currentLevel } = await liveTournamentService.moveToNextLevel(tournamentId);
            const durationSeconds = (currentLevel?.durationMinutes ?? (currentLevel?.isBreak ? 5 : 20)) * 60;
            await liveStateService.updateLiveState(tournamentId, {
                currentLevelNumber: tournament.currentLevelNumber,
                levelRemainingTimeSeconds: durationSeconds,
            });
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
                        breakType: currentLevel.breakType,
                    }
                    : null,
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * PATCH /tournaments/:id/level/prev - Перейти на предыдущий уровень
     */
    static async moveToPrevLevel(req, res) {
        try {
            const tournamentId = req.params.id;
            const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
            await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);
            const { tournament, currentLevel } = await liveTournamentService.moveToPrevLevel(tournamentId);
            const durationSeconds = (currentLevel?.durationMinutes ?? (currentLevel?.isBreak ? 5 : 20)) * 60;
            await liveStateService.updateLiveState(tournamentId, {
                currentLevelNumber: tournament.currentLevelNumber,
                levelRemainingTimeSeconds: durationSeconds,
            });
            res.json({
                message: 'Moved to previous level',
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
                        breakType: currentLevel.breakType,
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
                    breakType: currentLevel.breakType,
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
     * ADMIN: в любой момент. CONTROLLER: только когда остался 1 игрок после поздней регистрации
     */
    static async finishTournament(req, res) {
        try {
            const tournamentId = req.params.id;
            const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
            await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);
            if (req.user?.role === 'CONTROLLER') {
                const liveState = await liveStateService.getLiveState(tournamentId);
                const playersCount = liveState?.playersCount ?? 0;
                if (playersCount !== 1) {
                    return res.status(400).json({
                        error: 'Контроллер может завершить турнир только когда остался один игрок после поздней регистрации',
                    });
                }
                const { total: unpaidBillsCount } = await billService.getAllBills({
                    tournamentId,
                    status: PlayerBill_1.PlayerBillStatus.PENDING,
                    limit: 1,
                });
                if (unpaidBillsCount > 0) {
                    return res.status(400).json({
                        error: 'Нельзя завершить турнир: у некоторых игроков есть неоплаченные счета. Закройте все счета перед завершением.',
                    });
                }
            }
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
    /**
     * GET /tournaments/:id/player-balances - Балансы игроков (Controller, Admin)
     */
    static async getPlayerBalances(req, res) {
        try {
            const tournamentId = req.params.id;
            const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
            await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);
            const balances = await tournamentBalanceService.getTournamentPlayerBalances(tournamentId);
            res.json({ balances });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * POST /tournaments/:id/player/:playerId/pay - Оплата счёта игрока
     */
    static async recordPayment(req, res) {
        try {
            const tournamentId = req.params.id;
            const playerId = req.params.playerId;
            const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
            await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);
            const { cashAmount = 0, nonCashAmount = 0 } = req.body;
            const cash = Math.round(Math.max(0, Number(cashAmount)) * 100);
            const nonCash = Math.round(Math.max(0, Number(nonCashAmount)) * 100);
            const payment = await tournamentBalanceService.recordPayment(tournamentId, playerId, cash, nonCash);
            res.json({
                message: 'Payment recorded',
                payment: {
                    id: payment.id,
                    cashAmount: payment.cashAmount,
                    nonCashAmount: payment.nonCashAmount,
                    createdAt: payment.createdAt,
                },
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
}
exports.LiveTournamentController = LiveTournamentController;
//# sourceMappingURL=LiveTournamentController.js.map