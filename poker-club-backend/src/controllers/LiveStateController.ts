import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { LiveStateService } from '../services/LiveStateService';

const liveStateService = new LiveStateService();

export class LiveStateController {
  /**
   * GET /tournaments/:id/live - Получить Live State турнира
   */
  static async getLiveState(req: AuthRequest, res: Response) {
    try {
      const tournamentId = req.params.id as string;

      const liveState = await liveStateService.getOrCreateLiveState(tournamentId);

      if (!liveState) {
        return res.status(404).json({ error: 'Live state not found' });
      }

      res.json({
        liveState: {
          tournamentId: liveState.tournament.id,
          tournamentName: liveState.tournament.name,
          currentLevelNumber: liveState.currentLevelNumber,
          levelRemainingTimeSeconds: liveState.levelRemainingTimeSeconds,
          playersCount: liveState.playersCount,
          averageStack: liveState.averageStack,
          isPaused: liveState.isPaused,
          liveStatus: liveState.liveStatus,
          nextBreakTime: liveState.nextBreakTime,
          updatedAt: liveState.updatedAt,
        },
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

  /**
   * PATCH /tournaments/:id/pause - Поставить турнир на паузу
   * Только для администраторов
   */
  static async pauseTournament(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const tournamentId = req.params.id as string;

      const liveState = await liveStateService.pauseTournament(tournamentId);

      res.json({
        message: 'Tournament paused',
        liveState: {
          tournamentId: liveState.tournament.id,
          isPaused: liveState.isPaused,
          liveStatus: liveState.liveStatus,
        },
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

  /**
   * PATCH /tournaments/:id/resume - Возобновить турнир
   * Только для администраторов
   */
  static async resumeTournament(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const tournamentId = req.params.id as string;

      const liveState = await liveStateService.resumeTournament(tournamentId);

      res.json({
        message: 'Tournament resumed',
        liveState: {
          tournamentId: liveState.tournament.id,
          isPaused: liveState.isPaused,
          liveStatus: liveState.liveStatus,
        },
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

  /**
   * PATCH /tournaments/:id/live/recalculate - Пересчитать статистику
   * Только для администраторов
   */
  static async recalculateStats(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const tournamentId = req.params.id as string;

      const liveState = await liveStateService.recalculateStats(tournamentId);

      res.json({
        message: 'Stats recalculated',
        liveState: {
          tournamentId: liveState.tournament.id,
          playersCount: liveState.playersCount,
          averageStack: liveState.averageStack,
        },
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

  /**
   * PATCH /tournaments/:id/live/time - Обновить оставшееся время
   * Только для администраторов
   */
  static async updateLevelTime(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const tournamentId = req.params.id as string;
      const { remainingSeconds } = req.body;

      if (remainingSeconds === undefined) {
        return res.status(400).json({ error: 'remainingSeconds is required' });
      }

      const liveState = await liveStateService.updateLevelTime(
        tournamentId,
        remainingSeconds
      );

      res.json({
        message: 'Level time updated',
        liveState: {
          tournamentId: liveState.tournament.id,
          levelRemainingTimeSeconds: liveState.levelRemainingTimeSeconds,
        },
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }
}
