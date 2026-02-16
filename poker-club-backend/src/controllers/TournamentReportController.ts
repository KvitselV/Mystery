import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { TournamentAdminReportService } from '../services/TournamentAdminReportService';
import { TournamentService } from '../services/TournamentService';
import { AppDataSource } from '../config/database';
import { TournamentResult } from '../models/TournamentResult';

const adminReportService = new TournamentAdminReportService();
const tournamentService = new TournamentService();

export class TournamentReportController {
  /**
   * GET /tournaments/:id/admin-report — Отчёт для администратора
   */
  static async getAdminReport(req: AuthRequest, res: Response) {
    try {
      const tournamentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
      await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);

      let report = await adminReportService.getByTournamentId(tournamentId);
      if (!report) report = await adminReportService.getOrCreate(tournamentId);

      res.json({
        report: {
          id: report.id,
          tournamentId: report.tournamentId,
          attendanceCount: report.attendanceCount,
          cashRevenue: report.cashRevenue,
          nonCashRevenue: report.nonCashRevenue,
          expenses: report.expenses || [],
          totalProfit: report.totalProfit,
        },
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

  /**
   * PATCH /tournaments/:id/admin-report — Обновить отчёт (можно заполнять позже)
   */
  static async updateAdminReport(req: AuthRequest, res: Response) {
    try {
      const tournamentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
      await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);

      const { attendanceCount, cashRevenue, nonCashRevenue, expenses } = req.body;
      const report = await adminReportService.update(tournamentId, {
        attendanceCount: attendanceCount !== undefined ? Number(attendanceCount) : undefined,
        cashRevenue: cashRevenue !== undefined ? Math.round(Number(cashRevenue) * 100) : undefined,
        nonCashRevenue: nonCashRevenue !== undefined ? Math.round(Number(nonCashRevenue) * 100) : undefined,
        expenses: Array.isArray(expenses)
          ? expenses.map((e: { description?: string; amount?: number }) => ({
              description: e.description || '',
              amount: Math.round((e.amount || 0) * 100),
            }))
          : undefined,
      });

      res.json({
        report: {
          id: report.id,
          tournamentId: report.tournamentId,
          attendanceCount: report.attendanceCount,
          cashRevenue: report.cashRevenue,
          nonCashRevenue: report.nonCashRevenue,
          expenses: report.expenses || [],
          totalProfit: report.totalProfit,
        },
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

  /**
   * GET /tournaments/:id/player-results — Результаты для игроков (место, очки)
   */
  static async getPlayerResults(req: AuthRequest, res: Response) {
    try {
      const tournamentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      const resultRepo = AppDataSource.getRepository(TournamentResult);
      const allResults = await resultRepo.find({
        where: { tournament: { id: tournamentId } },
        relations: ['player', 'player.user'],
        order: { finishPosition: 'ASC' },
      });

      // Дедупликация: один игрок — одно место (берём лучшее по finishPosition)
      const seen = new Map<string, { finishPosition: number; playerId: string; playerName: string; clubCardNumber?: string; points: number }>();
      for (const r of allResults) {
        const pid = r.player?.id;
        if (!pid) continue;
        const existing = seen.get(pid);
        if (!existing || r.finishPosition < existing.finishPosition) {
          seen.set(pid, {
            finishPosition: r.finishPosition,
            playerId: pid,
            playerName: r.player?.user?.name || 'Игрок',
            clubCardNumber: r.player?.user?.clubCardNumber,
            points: r.points ?? 0,
          });
        }
      }
      const results = Array.from(seen.values()).sort((a, b) => a.finishPosition - b.finishPosition);

      res.json({
        results: results.map((r) => ({
          finishPosition: r.finishPosition,
          playerId: r.playerId,
          playerName: r.playerName,
          clubCardNumber: r.clubCardNumber,
          points: r.points,
        })),
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }
}
