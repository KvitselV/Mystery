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
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
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

      const limit = parseInt(req.query.limit as string) || 20;
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
          playerName: entry.playerProfile.user.name,
          userId: entry.playerProfile.user.id,
          avatarUrl: entry.playerProfile.user.avatarUrl ?? undefined,
          tournamentsCount: entry.tournamentsCount,
          averageFinish: entry.averageFinish,
          ratingPoints: entry.ratingPoints,
          rankCode: entry.playerProfile.rankCode,
        })),
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
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
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
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
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

  /**
   * GET /leaderboards/period-ratings - Рейтинг за период (неделя / месяц / год)
   */
  static async getPeriodRatings(req: AuthRequest, res: Response) {
    try {
      const period = (req.query.period as string) || 'week';
      const clubId = (req.query.clubId as string) || undefined;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      if (!['week', 'month', 'year'].includes(period)) {
        return res.status(400).json({ error: 'Invalid period. Use week, month or year' });
      }
      const entries = await leaderboardService.getPeriodRatings(
        period as 'week' | 'month' | 'year',
        clubId || null,
        limit,
        offset
      );
      res.json({ entries });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Operation failed';
      console.error('[getPeriodRatings]', error);
      res.status(400).json({ error: msg });
    }
  }

  /**
   * GET /leaderboards/rank-mmr - Получить топ по рангам
   */
  static async getRankMMRLeaderboard(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const leaderboard = await leaderboardService.createRankMMRLeaderboard();
      const entries = await leaderboardService.getLeaderboardEntries(
        leaderboard.id,
        limit,
        offset
      );

      res.json({
        leaderboard: {
          id: leaderboard.id,
          name: leaderboard.name,
          type: leaderboard.type,
        },
        entries: entries.map((entry) => ({
          rankPosition: entry.rankPosition,
          playerName: entry.playerProfile.user.name,
          userId: entry.playerProfile.user.id,
          avatarUrl: entry.playerProfile.user.avatarUrl ?? undefined,
          rankCode: entry.playerProfile.rankCode,
          ratingPoints: entry.ratingPoints,
          tournamentsCount: entry.tournamentsCount,
        })),
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }
}
