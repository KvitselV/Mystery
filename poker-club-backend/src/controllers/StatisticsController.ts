import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { StatisticsService } from '../services/StatisticsService';
import { AppDataSource } from '../config/database';
import { PlayerProfile } from '../models/PlayerProfile';

const statisticsService = new StatisticsService();
const profileRepo = AppDataSource.getRepository(PlayerProfile);

function canAccessUser(req: AuthRequest, userId: string): boolean {
  if (!req.user) return false;
  return req.user.userId === userId || req.user.role === 'ADMIN';
}

export class StatisticsController {
  /**
   * GET /statistics/user/:userId — только свой профиль или ADMIN
   */
  static async getFullStatistics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId as string;
      if (!canAccessUser(req, userId)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const profile = await profileRepo.findOne({
        where: { user: { id: userId } },
        relations: ['user'],
      });

      if (!profile) {
        res.status(404).json({ error: 'Player profile not found' });
        return;
      }

      const stats = await statisticsService.getPlayerFullStatistics(profile.id);
      // Не возвращаем raw-сущности (profile, lastTournament) — они могут вызвать ошибки сериализации
      const { profile: _p, lastTournament: _t, ...serializable } = stats;
      res.json(serializable);
    } catch (error) {
      console.error('Error fetching full statistics:', error);
      res.status(500).json({ error: 'Failed to fetch full statistics' });
    }
  }

  /**
   * GET /statistics/user/:userId/finishes
   */
  static async getFinishStatistics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId as string;
      if (!canAccessUser(req, userId)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

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
   */
  static async getParticipationChart(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.params.userId as string;
      if (!canAccessUser(req, userId)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

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
   */
  static async getLastTournament(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId as string;
      if (!canAccessUser(req, userId)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

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
   * POST /statistics/user/:userId/update — только ADMIN (requireRole в роуте)
   */
  static async updateStatistics(req: AuthRequest, res: Response): Promise<void> {
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
      res.status(500).json({ error: 'Failed to update statistics' });
    }
  }

  /**
   * GET /statistics/profile/:playerProfileId — получить профиль по playerProfileId (доступно всем авторизованным)
   */
  static async getProfileByPlayerProfileId(req: AuthRequest, res: Response): Promise<void> {
    try {
      const playerProfileId = req.params.playerProfileId as string;

      const profile = await profileRepo.findOne({
        where: { id: playerProfileId },
        relations: ['user'],
      });

      if (!profile) {
        res.status(404).json({ error: 'Player profile not found' });
        return;
      }

      const stats = await statisticsService.getPlayerFullStatistics(profile.id);
      // Возвращаем только сериализуемые данные
      const { profile: _p, lastTournament: _t, ...serializable } = stats;
      res.json({
        ...serializable,
        user: {
          id: profile.user.id,
          name: profile.user.name,
          clubCardNumber: profile.user.clubCardNumber,
          avatarUrl: profile.user.avatarUrl,
          createdAt: profile.user.createdAt,
        },
      });
    } catch (error) {
      console.error('Error fetching profile by playerProfileId:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  /**
   * GET /statistics/user/:userId/public — получить профиль по userId (доступно всем авторизованным, для просмотра чужих профилей)
   */
  static async getPublicProfileByUserId(req: AuthRequest, res: Response): Promise<void> {
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

      const stats = await statisticsService.getPlayerFullStatistics(profile.id);
      // Возвращаем только сериализуемые данные
      const { profile: _p, lastTournament: _t, ...serializable } = stats;
      res.json({
        ...serializable,
        user: {
          id: profile.user.id,
          name: profile.user.name,
          clubCardNumber: profile.user.clubCardNumber,
          avatarUrl: profile.user.avatarUrl,
          createdAt: profile.user.createdAt,
        },
      });
    } catch (error) {
      console.error('Error fetching public profile by userId:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }
}
