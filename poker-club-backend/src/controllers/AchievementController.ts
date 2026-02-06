import { Request, Response } from 'express';
import { AchievementService } from '../services/AchievementService';

const achievementService = new AchievementService();

export class AchievementController {
  /**
   * GET /achievements/types
   * Получить все типы достижений
   */
  static async getAllTypes(req: Request, res: Response): Promise<void> {
    try {
      const types = await achievementService.getAllAchievementTypes();
      res.json(types);
    } catch (error) {
      console.error('Error fetching achievement types:', error);
      res.status(500).json({ error: 'Failed to fetch achievement types' });
    }
  }

  /**
   * GET /achievements/user/:userId
   * Получить все достижения пользователя
   */
  static async getUserAchievements(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.params.userId as string;
      const achievements = await achievementService.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      res.status(500).json({ error: 'Failed to fetch user achievements' });
    }
  }

  /**
   * GET /achievements/user/:userId/progress
   * Получить прогресс достижений пользователя
   */
  static async getUserProgress(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId as string;
      const progress = await achievementService.getUserAchievementProgress(
        userId
      );
      res.json(progress);
    } catch (error) {
      console.error('Error fetching user achievement progress:', error);
      res
        .status(500)
        .json({ error: 'Failed to fetch user achievement progress' });
    }
  }

  /**
   * POST /achievements/check/:userId/:tournamentId
   * Проверить и выдать достижения (вызывается автоматически)
   */
  static async checkAchievements(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId as string;
      const tournamentId = req.params.tournamentId as string;
      const granted = await achievementService.checkAndGrantAchievements(
        userId,
        tournamentId
      );
      res.json({
        message: `Granted ${granted.length} achievement(s)`,
        achievements: granted,
      });
    } catch (error) {
      console.error('Error checking achievements:', error);
      res.status(500).json({ error: 'Failed to check achievements' });
    }
  }

  /**
   * POST /achievements/seed
   * Инициализировать типы достижений (admin only)
   */
  static async seedTypes(req: Request, res: Response): Promise<void> {
    try {
      await achievementService.seedAchievementTypes();
      res.json({ message: 'Achievement types seeded successfully' });
    } catch (error) {
      console.error('Error seeding achievement types:', error);
      res.status(500).json({ error: 'Failed to seed achievement types' });
    }
  }
}
