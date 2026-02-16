import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { MMRService } from '../services/MMRService';

const mmrService = new MMRService();

export class MMRController {
  /**
   * GET /mmr/top - Получить топ игроков по ММР
   */
  static async getTopPlayers(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const players = await mmrService.getTopPlayersByMMR(limit);

      res.json({
        players: players.map((player) => ({
          id: player.id,
          name: player.user.name,
          mmrValue: player.mmrValue,
          rankCode: player.rankCode,
        })),
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

   /**
   * GET /mmr/rank/:rankCode - Получить игроков по рангу
   */
  static async getPlayersByRank(req: AuthRequest, res: Response) {
    try {
      const { rankCode } = req.params;

      // Проверка что rankCode это строка
      if (Array.isArray(rankCode)) {
        return res.status(400).json({ error: 'Invalid rank code format' });
      }

      if (!['E', 'D', 'C', 'B', 'A', 'S', 'SS'].includes(rankCode as string)) {
        return res.status(400).json({ error: 'Invalid rank code' });
      }

      const players = await mmrService.getPlayersByRank(
        rankCode as 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS'
      );

      res.json({
        rankCode,
        players: players.map((player) => ({
          id: player.id,
          name: player.user.name,
          mmrValue: player.mmrValue,
          rankCode: player.rankCode,
        })),
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

  /**
   * POST /mmr/recalculate/:tournamentId - Пересчитать ММР для турнира
   * Только для администраторов
   */
  static async recalculateTournamentMMR(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { tournamentId } = req.params;

      // Проверка что tournamentId это строка
      if (Array.isArray(tournamentId)) {
        return res.status(400).json({ error: 'Invalid tournament ID format' });
      }

      await mmrService.recalculateTournamentMMR(tournamentId as string);

      res.json({
        message: 'MMR recalculation completed',
        tournamentId,
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }
}
