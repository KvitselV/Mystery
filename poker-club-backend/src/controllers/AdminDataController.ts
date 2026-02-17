import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { AdminDataService } from '../services/AdminDataService';

const adminDataService = new AdminDataService();

export class AdminDataController {
  /**
   * GET /admin/data — Все данные из БД (только ADMIN)
   */
  static async getAllData(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const data = await adminDataService.getAllData();
      res.json(data);
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load data' });
    }
  }

  /**
   * PATCH /admin/entity/:table/:id — Обновить запись (только ADMIN)
   */
  static async updateEntity(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const table = Array.isArray(req.params.table) ? req.params.table[0] : req.params.table;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const body = req.body as Record<string, unknown>;
      if (!table || !id) {
        return res.status(400).json({ error: 'table and id required' });
      }
      const result = await adminDataService.updateEntity(table, id, body);
      res.json(result);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Update failed';
      res.status(400).json({ error: msg });
    }
  }
}
