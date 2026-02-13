import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { AchievementService } from '../services/AchievementService';

const achievementService = new AchievementService();

function canAccessUser(req: AuthRequest, userId: string): boolean {
  if (!req.user) return false;
  return req.user.userId === userId || req.user.role === 'ADMIN';
}

export class AchievementController {
  static async getAllTypes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const types = await achievementService.getAllAchievementTypes();
      res.json(types);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch achievement types' });
    }
  }

  static async getUserAchievements(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId as string;
      if (!canAccessUser(req, userId)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      const achievements = await achievementService.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user achievements' });
    }
  }

  static async getUserProgress(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId as string;
      if (!canAccessUser(req, userId)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      const progress = await achievementService.getUserAchievementProgress(userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user achievement progress' });
    }
  }

  /**
   * POST /achievements/check — только ADMIN (requireRole в роуте)
   */
  static async checkAchievements(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId as string;
      const tournamentId = req.params.tournamentId as string;
      const granted = await achievementService.checkAndGrantAchievements(userId, tournamentId);
      res.json({
        message: `Granted ${granted.length} achievement(s)`,
        achievements: granted,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check achievements' });
    }
  }

  /**
   * POST /achievements/seed — только ADMIN (requireRole в роуте)
   */
  static async seedTypes(req: AuthRequest, res: Response): Promise<void> {
    try {
      await achievementService.seedAchievementTypes();
      res.json({ message: 'Achievement types seeded successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to seed achievement types' });
    }
  }
}
