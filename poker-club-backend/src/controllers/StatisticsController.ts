import { Request, Response } from 'express';
import { StatisticsService } from '../services/StatisticsService';
import { AppDataSource } from '../config/database';
import { PlayerProfile } from '../models/PlayerProfile';

const statisticsService = new StatisticsService();
const profileRepo = AppDataSource.getRepository(PlayerProfile);

export class StatisticsController {
  /**
   * GET /statistics/user/:userId
   * Получить полную статистику пользователя
   */
  static async getFullStatistics(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId as string;

      // Получить playerProfileId по userId
      const profile = await profileRepo.findOne({
        where: { user: { id: userId } },
        relations: ['user'],
      });

      if (!profile) {
        res.status(404).json({ error: 'Player profile not found' });
        return;
      }

      const stats = await statisticsService.getPlayerFullStatistics(profile.id);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching full statistics:', error);
      res.status(500).json({ error: 'Failed to fetch full statistics' });
    }
  }

  /**
   * GET /statistics/user/:userId/finishes
   * Получить статистику финишей
   */
  static async getFinishStatistics(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId as string;

      const profile = await profileRepo.findOne({
        where: { user: { id: userId } },
        relations: ['user'],
      });

      if (!profile) {
        res.status(404).json({ error: 'Player profile not found' });
        return;
      }

      const stats = await statisticsService.getFinishStatistics(profile.id);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching finish statistics:', error);
      res.status(500).json({ error: 'Failed to fetch finish statistics' });
    }
  }

  /**
   * GET /statistics/user/:userId/participation
   * Получить график участия
   */
  static async getParticipationChart(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.params.userId as string;

      const profile = await profileRepo.findOne({
        where: { user: { id: userId } },
        relations: ['user'],
      });

      if (!profile) {
        res.status(404).json({ error: 'Player profile not found' });
        return;
      }

      const chart = await statisticsService.getParticipationChart(profile.id);
      res.json(chart);
    } catch (error) {
      console.error('Error fetching participation chart:', error);
      res.status(500).json({ error: 'Failed to fetch participation chart' });
    }
  }

  /**
   * GET /statistics/user/:userId/last-tournament
   * Получить последний турнир
   */
  static async getLastTournament(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId as string;

      const profile = await profileRepo.findOne({
        where: { user: { id: userId } },
        relations: ['user'],
      });

      if (!profile) {
        res.status(404).json({ error: 'Player profile not found' });
        return;
      }

      const tournament = await statisticsService.getLastTournament(profile.id);
      res.json(tournament);
    } catch (error) {
      console.error('Error fetching last tournament:', error);
      res.status(500).json({ error: 'Failed to fetch last tournament' });
    }
  }

  /**
   * POST /statistics/user/:userId/update
   * Обновить статистику пользователя вручную (admin)
   */
  static async updateStatistics(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId as string;
      const { tournamentId } = req.body;

      if (!tournamentId) {
        res.status(400).json({ error: 'tournamentId is required' });
        return;
      }

      await statisticsService.updatePlayerStatistics(userId, tournamentId);
      res.json({ message: 'Statistics updated successfully' });
    } catch (error) {
      console.error('Error updating statistics:', error);
      res.status(500).json({ error: 'Failed to update statistics' });
    }
  }
}
