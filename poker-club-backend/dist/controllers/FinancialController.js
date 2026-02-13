"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialController = void 0;
const FinancialService_1 = require("../services/FinancialService");
const database_1 = require("../config/database");
const PlayerProfile_1 = require("../models/PlayerProfile");
const financialService = new FinancialService_1.FinancialService();
const playerProfileRepository = database_1.AppDataSource.getRepository(PlayerProfile_1.PlayerProfile);
class FinancialController {
    /**
     * Вспомогательный метод: получить PlayerProfile.id по User.id
     */
    static async getPlayerProfileId(userId) {
        const playerProfile = await playerProfileRepository.findOne({
            where: { user: { id: userId } },
        });
        if (!playerProfile) {
            throw new Error('Player profile not found');
        }
        return playerProfile.id;
    }
    /**
     * GET /user/deposit - Получить баланс депозита
     */
    static async getDeposit(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const playerProfileId = await FinancialController.getPlayerProfileId(req.user.userId);
            const balance = await financialService.getBalance(playerProfileId);
            res.json({
                depositBalance: balance.depositBalance,
                totalDeposited: balance.totalDeposited,
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * POST /user/deposit/topup - Пополнить депозит
     */
    static async topupDeposit(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const { amount } = req.body;
            if (!amount || amount <= 0) {
                return res.status(400).json({ error: 'Invalid amount' });
            }
            const playerProfileId = await FinancialController.getPlayerProfileId(req.user.userId);
            const balance = await financialService.topupDeposit(playerProfileId, amount);
            res.json({
                message: 'Deposit topup successful',
                depositBalance: balance.depositBalance,
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * GET /user/operations - Получить историю операций
     */
    static async getOperations(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            const playerProfileId = await FinancialController.getPlayerProfileId(req.user.userId);
            const { operations, total } = await financialService.getOperationHistory(playerProfileId, limit, offset);
            res.json({
                operations: operations.map((op) => ({
                    id: op.id,
                    type: op.operationType,
                    amount: op.amount,
                    tournamentId: op.tournament?.id,
                    tournamentName: op.tournament?.name,
                    createdAt: op.createdAt,
                })),
                total,
                limit,
                offset,
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
}
exports.FinancialController = FinancialController;
//# sourceMappingURL=FinancialController.js.map