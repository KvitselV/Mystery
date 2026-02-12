import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { RewardService } from '../services/RewardService';

const rewardService = new RewardService();

export class RewardController {
  static async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const { name, description, imageUrl, type } = req.body;
      if (!name) return res.status(400).json({ error: 'name is required' });
      const reward = await rewardService.create({
        name,
        description,
        imageUrl,
        type,
      });
      res.status(201).json(reward);
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  }

  static async getRewards(req: AuthRequest, res: Response) {
    try {
      const isActiveRaw = req.query.isActive;
      const limitRaw = req.query.limit;
      const offsetRaw = req.query.offset;
      const isActive = typeof isActiveRaw === 'string' ? isActiveRaw === 'true' : undefined;
      const limit = typeof limitRaw === 'string' ? parseInt(limitRaw, 10) : 50;
      const offset = typeof offsetRaw === 'string' ? parseInt(offsetRaw, 10) : 0;
      const { rewards, total } = await rewardService.getRewards({
        isActive,
        limit,
        offset,
      });
      res.json({ rewards, total });
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const reward = await rewardService.getById(id);
      res.json(reward);
    } catch (e: unknown) {
      res.status(404).json({ error: (e as Error).message });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { name, description, imageUrl, type, isActive } = req.body;
      const reward = await rewardService.update(id, {
        name,
        description,
        imageUrl,
        type,
        isActive,
      });
      res.json(reward);
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await rewardService.delete(id);
      res.json({ message: 'Reward deleted' });
    } catch (e: unknown) {
      res.status(400).json({ error: (e as Error).message });
    }
  }
}
