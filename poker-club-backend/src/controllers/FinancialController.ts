import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { FinancialService } from '../services/FinancialService';
import { AppDataSource } from '../config/database';
import { PlayerProfile } from '../models/PlayerProfile';

const financialService = new FinancialService();
const playerProfileRepository = AppDataSource.getRepository(PlayerProfile);

export class FinancialController {
  /**
   * Вспомогательный метод: получить PlayerProfile.id по User.id
   */
  private static async getPlayerProfileId(userId: string): Promise<string> {
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
  static async getDeposit(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const playerProfileId = await FinancialController.getPlayerProfileId(req.user.userId);
      const balance = await financialService.getBalance(playerProfileId);

      res.json({
        depositBalance: balance.depositBalance,
        totalDeposited: balance.totalDeposited,
        totalWithdrawn: balance.totalWithdrawn,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /user/deposit/topup - Пополнить депозит
   */
  static async topupDeposit(req: AuthRequest, res: Response) {
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
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /user/deposit/withdraw - Вывести средства
   */
  static async withdrawDeposit(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const playerProfileId = await FinancialController.getPlayerProfileId(req.user.userId);
      const balance = await financialService.withdrawDeposit(playerProfileId, amount);

      res.json({
        message: 'Withdrawal successful',
        depositBalance: balance.depositBalance,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /user/operations - Получить историю операций
   */
  static async getOperations(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const playerProfileId = await FinancialController.getPlayerProfileId(req.user.userId);
      const { operations, total } = await financialService.getOperationHistory(
        playerProfileId,
        limit,
        offset
      );

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
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
