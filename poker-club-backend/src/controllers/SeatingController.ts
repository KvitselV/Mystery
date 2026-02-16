import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { SeatingService } from '../services/SeatingService';
import { LiveStateService } from '../services/LiveStateService';
import { TournamentService } from '../services/TournamentService';
import { io } from '../app';
import { broadcastSeatingChange } from '../websocket';

const seatingService = new SeatingService();
const liveStateService = new LiveStateService();
const tournamentService = new TournamentService();

export class SeatingController {
  static async initTablesFromClub(req: AuthRequest, res: Response) {
    try {
      const tournamentId = req.params.id as string;
      const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
      await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);

      const result = await seatingService.initializeTablesFromClub(tournamentId);

      res.json({
        message: 'Tournament tables initialized from club',
        ...result,
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

  static async autoSeating(req: AuthRequest, res: Response) {
    try {
      const tournamentId = req.params.id as string;
      const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
      await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);

      const moves = req.body?.moves as { tableId: string; utgSeatNumber?: number; playerIds?: string[] }[] | undefined;

      const result = await seatingService.autoSeating(tournamentId, moves);

      if (result.needInput) {
        return res.status(409).json({
          code: 'NEED_INPUT',
          message: 'Specify UTG seat or select players to move',
          ...result,
        });
      }

      await liveStateService.recalculateStats(tournamentId);
      broadcastSeatingChange(io, tournamentId, { type: 'auto_seating' });

      res.json({
        message: 'Auto seating completed successfully',
        tablesCreated: result.tablesCreated,
        seatsAssigned: result.seatsAssigned,
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

  static async manualReseating(req: AuthRequest, res: Response) {
    try {
      const tournamentId = req.params.id as string;
      const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
      await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);
      const { playerId, newTableId, newSeatNumber } = req.body;

      if (!playerId || !newTableId || !newSeatNumber) {
        return res.status(400).json({
          error: 'playerId, newTableId, and newSeatNumber are required',
        });
      }

      const seat = await seatingService.manualReseating(
        tournamentId,
        playerId,
        newTableId,
        newSeatNumber
      );

      broadcastSeatingChange(io, tournamentId, { type: 'manual_reseat', playerId, newTableId, newSeatNumber });

      res.json({
        message: 'Player reseated successfully',
        seat: {
          id: seat.id,
          tableId: seat.table.id,
          tableNumber: seat.table.tableNumber,
          seatNumber: seat.seatNumber,
          playerName: seat.playerName,
        },
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

  /**
   * GET /tournaments/:id/tables - Получить все столы турнира
   * Admin/Controller: все столы. Гости: только столы с игроками (occupiedSeats > 0).
   */
  static async getTournamentTables(req: AuthRequest, res: Response) {
    try {
      const tournamentId = req.params.id as string;
      const tournament = await tournamentService.getTournamentById(tournamentId);
      const isAdmin = req.user?.role === 'ADMIN';
      const isControllerForClub =
        req.user?.role === 'CONTROLLER' && tournament.clubId === req.user?.managedClubId;

      let tables = await seatingService.getTournamentTables(tournamentId);
      if (!isAdmin && !isControllerForClub) {
        tables = tables.filter((t) => (t.occupiedSeats ?? 0) > 0);
      }

      res.json({
        tables: tables.map((table) => ({
          id: table.id,
          tableNumber: table.tableNumber,
          clubTableId: table.clubTableId ?? undefined,
          clubTable: table.clubTable
            ? { id: table.clubTable.id, tableNumber: table.clubTable.tableNumber }
            : undefined,
          status: table.status,
          occupiedSeats: table.occupiedSeats,
          maxSeats: table.maxSeats,
          seats: table.seats.map((seat) => ({
            id: seat.id,
            seatNumber: seat.seatNumber,
            isOccupied: seat.isOccupied,
            status: seat.status,
            playerName: seat.playerName,
            playerId: seat.player?.id,
            clubCardNumber: seat.player?.user?.clubCardNumber,
          })),
        })),
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

  /**
   * GET /tournaments/:tournamentId/tables/:tableId - Получить детали стола
   * Доступно администраторам и клиентам
   */
  static async getTableDetails(req: AuthRequest, res: Response) {
    try {
      const tableId = req.params.tableId as string;

      const table = await seatingService.getTableDetails(tableId);

      res.json({
        table: {
          id: table.id,
          tableNumber: table.tableNumber,
          clubTableId: table.clubTableId ?? undefined,
          clubTable: table.clubTable
            ? { id: table.clubTable.id, tableNumber: table.clubTable.tableNumber }
            : undefined,
          tournamentId: table.tournament.id,
          status: table.status,
          occupiedSeats: table.occupiedSeats,
          maxSeats: table.maxSeats,
          seats: table.seats.map((seat) => ({
            id: seat.id,
            seatNumber: seat.seatNumber,
            isOccupied: seat.isOccupied,
            status: seat.status,
            playerName: seat.playerName,
            playerId: seat.player?.id,
            playerRank: seat.player?.rankCode,
          })),
        },
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

  /**
   * POST /tournaments/:id/player/:playerId/eliminate - Исключить игрока
   * Только для администраторов
   */
  static async eliminatePlayer(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const playerId = req.params.playerId as string;
      const { finishPosition } = req.body;

      if (!finishPosition) {
        return res.status(400).json({ error: 'finishPosition is required' });
      }

      const seat = await seatingService.eliminatePlayer(playerId, finishPosition, req.params.id as string);

      res.json({
        message: 'Player eliminated successfully',
        seat: seat
          ? {
              id: seat.id,
              tableId: seat.table.id,
              status: seat.status,
              playerName: seat.playerName,
            }
          : null,
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }
}
