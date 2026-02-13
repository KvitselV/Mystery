import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { BillService } from '../services/BillService';
import { PlayerBillStatus } from '../models/PlayerBill';

const billService = new BillService();

export class BillController {
  /**
   * GET /user/bills — счета текущего пользователя
   */
  static async getMyBills(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const bills = await billService.getBillsByUserId(req.user.userId);
      res.json(bills);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch bills';
      res.status(500).json({ error: message });
    }
  }

  /**
   * GET /user/bills/:id — один счёт (свой или админ)
   */
  static async getMyBillById(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const billId = req.params.id as string;
      const isAdmin = req.user.role === 'ADMIN';
      const bill = await billService.getBillById(billId, req.user.userId, isAdmin);
      if (!bill) {
        res.status(404).json({ error: 'Bill not found' });
        return;
      }
      res.json(bill);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch bill';
      res.status(500).json({ error: message });
    }
  }

  /**
   * GET /bills — все счета (админ), с фильтрами
   */
  static async getAllBills(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tournamentId = req.query.tournamentId as string | undefined;
      const playerProfileId = req.query.playerProfileId as string | undefined;
      const status = req.query.status as PlayerBillStatus | undefined;
      const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
      const offset = req.query.offset != null ? Number(req.query.offset) : undefined;

      const { bills, total } = await billService.getAllBills({
        tournamentId,
        playerProfileId,
        status,
        limit,
        offset,
      });
      res.json({ bills, total });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch bills';
      res.status(500).json({ error: message });
    }
  }

  /**
   * GET /bills/:id — счёт по id (админ или свой)
   */
  static async getBillById(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const billId = req.params.id as string;
      const isAdmin = req.user.role === 'ADMIN';
      const bill = await billService.getBillById(billId, req.user.userId, isAdmin);
      if (!bill) {
        res.status(404).json({ error: 'Bill not found' });
        return;
      }
      res.json(bill);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch bill';
      res.status(500).json({ error: message });
    }
  }

  /**
   * PATCH /bills/:id/status — изменить статус оплаты (админ)
   */
  static async updateBillStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const billId = req.params.id as string;
      const { status } = req.body as { status: PlayerBillStatus };

      if (!status || !Object.values(PlayerBillStatus).includes(status)) {
        res.status(400).json({ error: 'Valid status required (PENDING | PAID)' });
        return;
      }

      const bill = await billService.updateBillStatus(billId, status);
      res.json(bill);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update bill status';
      res.status(error instanceof Error && message === 'Bill not found' ? 404 : 500).json({
        error: message,
      });
    }
  }
}
