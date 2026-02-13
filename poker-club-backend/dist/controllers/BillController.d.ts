import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class BillController {
    /**
     * GET /user/bills — счета текущего пользователя
     */
    static getMyBills(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /user/bills/:id — один счёт (свой или админ)
     */
    static getMyBillById(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /bills — все счета (админ), с фильтрами
     */
    static getAllBills(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /bills/:id — счёт по id (админ или свой)
     */
    static getBillById(req: AuthRequest, res: Response): Promise<void>;
    /**
     * PATCH /bills/:id/status — изменить статус оплаты (админ)
     */
    static updateBillStatus(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=BillController.d.ts.map