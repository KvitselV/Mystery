import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { LiveTournamentService } from '../services/LiveTournamentService';
import { TournamentService } from '../services/TournamentService';

const liveTournamentService = new LiveTournamentService();
const tournamentService = new TournamentService();

export class LiveTournamentController {

  static async rebuy(req: AuthRequest, res: Response) {
    try {
      const tournamentId = req.params.id as string;
      const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
      await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);
      const playerId = req.params.playerId as string;
      const { amount } = req.body;

      const operation = await liveTournamentService.rebuy(
        tournamentId,
        playerId,
        amount
      );

      res.json({
        message: 'Rebuy successful',
        operation: {
          id: operation.id,
          type: operation.operationType,
          amount: operation.amount,
          createdAt: operation.createdAt,
        },
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }


  static async addon(req: AuthRequest, res: Response) {
    try {
      const tournamentId = req.params.id as string;
      const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
      await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);
      const playerId = req.params.playerId as string;
      const { amount } = req.body;

      if (!amount) {
        return res.status(400).json({ error: 'amount is required' });
      }

      const operation = await liveTournamentService.addon(
        tournamentId,
        playerId,
        amount
      );

      res.json({
        message: 'Addon successful',
        operation: {
          id: operation.id,
          type: operation.operationType,
          amount: operation.amount,
          createdAt: operation.createdAt,
        },
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

  static async eliminatePlayer(req: AuthRequest, res: Response) {
    try {
      const tournamentId = req.params.id as string;
      const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
      await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);
      const playerId = req.params.playerId as string;
      const { finishPosition } = req.body;

      if (!finishPosition) {
        return res.status(400).json({ error: 'finishPosition is required' });
      }

      const result = await liveTournamentService.eliminatePlayer(
        tournamentId,
        playerId,
        finishPosition,

      );

      res.json({
        message: 'Player eliminated',
        result: {
          id: result.id,
          finishPosition: result.finishPosition,
          isFinalTable: result.isFinalTable,
        },
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

  /**
   * PATCH /tournaments/:id/level/next - Перейти на следующий уровень
   * Только для администраторов
   */
  static async moveToNextLevel(req: AuthRequest, res: Response) {
    try {
      const tournamentId = req.params.id as string;
      const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
      await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);

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
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

  /**
   * GET /tournaments/:id/level/current - Получить текущий уровень
   */
  static async getCurrentLevel(req: AuthRequest, res: Response) {
    try {
      const tournamentId = req.params.id as string;

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
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

  /**
   * GET /tournaments/:id/player/:playerId/operations - История операций игрока
   */
  static async getPlayerOperations(req: AuthRequest, res: Response) {
    try {
      const playerId = req.params.playerId as string;

      const operations = await liveTournamentService.getPlayerOperationsInTournament(playerId);

      res.json({
        operations: operations.map((op) => ({
          id: op.id,
          type: op.operationType,
          amount: op.amount,
          createdAt: op.createdAt,
        })),
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

  /**
   * POST /tournaments/:id/finish - Завершить турнир
   * Только для администраторов
   */
  static async finishTournament(req: AuthRequest, res: Response) {
    try {
      const tournamentId = req.params.id as string;
      const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
      await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);

      await liveTournamentService.finishTournament(tournamentId);

      res.json({
        message: 'Tournament finished successfully',
        tournamentId,
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

}
