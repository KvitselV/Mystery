import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { BlindStructureService } from '../services/BlindStructureService';

const blindStructureService = new BlindStructureService();

export class BlindStructureController {
  /**
   * POST /blind-structures - Создать структуру блайндов
   * Только для администраторов
   */
  static async createStructure(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { name, description, levels } = req.body;

      if (!name || !levels || !Array.isArray(levels) || levels.length === 0) {
        return res.status(400).json({
          error: 'name and levels array are required',
        });
      }

      const structure = await blindStructureService.createStructure({
        name,
        description,
        levels,
      });

      res.status(201).json({
        message: 'Blind structure created successfully',
        structure: {
          id: structure.id,
          name: structure.name,
          description: structure.description,
          levelsCount: structure.levels.length,
          levels: structure.levels.map((level) => ({
            id: level.id,
            levelNumber: level.levelNumber,
            smallBlind: level.smallBlind,
            bigBlind: level.bigBlind,
            ante: level.ante,
            durationMinutes: level.durationMinutes,
            isBreak: level.isBreak,
            breakName: level.breakName,
          })),
        },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /blind-structures - Получить все структуры
   */
  static async getAllStructures(req: AuthRequest, res: Response) {
    try {
      const structures = await blindStructureService.getAllStructures();

      res.json({
        structures: structures.map((structure) => ({
          id: structure.id,
          name: structure.name,
          description: structure.description,
          levelsCount: structure.levels.length,
          createdAt: structure.createdAt,
        })),
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /blind-structures/:id - Получить структуру по ID
   */
  static async getStructureById(req: AuthRequest, res: Response) {
    try {
      const structureId = req.params.id as string;

      const structure = await blindStructureService.getStructureById(structureId);

      res.json({
        structure: {
          id: structure.id,
          name: structure.name,
          description: structure.description,
          isActive: structure.isActive,
          createdAt: structure.createdAt,
          levels: structure.levels.map((level) => ({
            id: level.id,
            levelNumber: level.levelNumber,
            smallBlind: level.smallBlind,
            bigBlind: level.bigBlind,
            ante: level.ante,
            durationMinutes: level.durationMinutes,
            isBreak: level.isBreak,
            breakName: level.breakName,
          })),
        },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /blind-structures/:id/levels - Добавить уровень к структуре
   * Только для администраторов
   */
  static async addLevel(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const structureId = req.params.id as string;
      const { levelNumber, smallBlind, bigBlind, ante, durationMinutes, isBreak, breakName } = req.body;

      if (!levelNumber || !smallBlind || !bigBlind || !durationMinutes) {
        return res.status(400).json({
          error: 'levelNumber, smallBlind, bigBlind, and durationMinutes are required',
        });
      }

      const level = await blindStructureService.addLevel(structureId, {
        levelNumber,
        smallBlind,
        bigBlind,
        ante,
        durationMinutes,
        isBreak,
        breakName,
      });

      res.status(201).json({
        message: 'Level added successfully',
        level: {
          id: level.id,
          levelNumber: level.levelNumber,
          smallBlind: level.smallBlind,
          bigBlind: level.bigBlind,
          ante: level.ante,
          durationMinutes: level.durationMinutes,
          isBreak: level.isBreak,
          breakName: level.breakName,
        },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * DELETE /blind-structures/:id - Деактивировать структуру
   * Только для администраторов
   */
  static async deactivateStructure(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const structureId = req.params.id as string;

      const structure = await blindStructureService.deactivateStructure(structureId);

      res.json({
        message: 'Blind structure deactivated',
        structure: {
          id: structure.id,
          name: structure.name,
          isActive: structure.isActive,
        },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
