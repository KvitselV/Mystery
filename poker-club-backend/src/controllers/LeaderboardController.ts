import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { LeaderboardService } from '../services/LeaderboardService';

const leaderboardService = new LeaderboardService();

export class LeaderboardController {
  /**
   * GET /leaderboards - Получить все рейтинги
   */
  static async getAllLeaderboards(req: AuthRequest, res: Response) {
    try {
      const leaderboards = await leaderboardService.getAllLeaderboards();

      res.json({
        leaderboards: leaderboards.map((lb) => ({
          id: lb.id,
          name: lb.name,
          type: lb.type,
          periodStart: lb.periodStart,
          periodEnd: lb.periodEnd,
          seriesId: lb.seriesId,
          createdAt: lb.createdAt,
        })),
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /leaderboards/:id/entries - Получить записи рейтинга
   */
  static async getLeaderboardEntries(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      // Проверка что id это строка, а не массив
      if (Array.isArray(id)) {
        return res.status(400).json({ error: 'Invalid leaderboard ID' });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const entries = await leaderboardService.getLeaderboardEntries(
        id as string,
        limit,
        offset
      );

      res.json({
        entries: entries.map((entry) => ({
          id: entry.id,
          rankPosition: entry.rankPosition,
          playerName: `${entry.playerProfile.user.firstName} ${entry.playerProfile.user.lastName}`,
          tournamentsCount: entry.tournamentsCount,
          averageFinish: entry.averageFinish,
          ratingPoints: entry.ratingPoints,
          rankCode: entry.playerProfile.rankCode,
        })),
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  /**
   * POST /leaderboards/seasonal/create - Создать сезонный рейтинг
   * Только для администраторов
   */
  static async createSeasonalLeaderboard(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const leaderboard = await leaderboardService.createSeasonalLeaderboard();

      res.json({
        message: 'Seasonal leaderboard created',
        leaderboard: {
          id: leaderboard.id,
          name: leaderboard.name,
          type: leaderboard.type,
          periodStart: leaderboard.periodStart,
          periodEnd: leaderboard.periodEnd,
        },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /leaderboards/rank-mmr/update - Обновить рейтинг по ММР
   * Только для администраторов
   */
  static async updateRankMMRLeaderboard(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await leaderboardService.updateRankMMRLeaderboard();

      res.json({
        message: 'Rank MMR leaderboard updated successfully',
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /leaderboards/rank-mmr - Получить топ по рангам
   */
  static async getRankMMRLeaderboard(req: AuthRequest, res: Response) {
    try {
      const leaderboard = await leaderboardService.createRankMMRLeaderboard();
      const entries = await leaderboardService.getLeaderboardEntries(
        leaderboard.id,
        100
      );

      res.json({
        leaderboard: {
          id: leaderboard.id,
          name: leaderboard.name,
          type: leaderboard.type,
        },
        entries: entries.map((entry) => ({
          rankPosition: entry.rankPosition,
          playerName: `${entry.playerProfile.user.firstName} ${entry.playerProfile.user.lastName}`,
          rankCode: entry.playerProfile.rankCode,
          ratingPoints: entry.ratingPoints,
          tournamentsCount: entry.tournamentsCount,
        })),
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
