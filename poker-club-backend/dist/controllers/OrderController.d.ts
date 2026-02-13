import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class OrderController {
    /**
     * POST /orders — создать заказ от имени текущего пользователя
     */
    static createOrder(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /orders/my — заказы текущего пользователя
     */
    static getMyOrders(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /orders/:id — заказ по ID (только свой или admin)
     */
    static getOrderById(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /orders — все заказы (admin)
     */
    static getAllOrders(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /orders/tournament/:tournamentId — заказы турнира (admin)
     */
    static getTournamentOrders(req: AuthRequest, res: Response): Promise<void>;
    /**
     * PATCH /orders/:id/status — обновить статус заказа (admin)
     */
    static updateOrderStatus(req: AuthRequest, res: Response): Promise<void>;
    /**
     * POST /orders/:id/cancel — отменить заказ (только свой или admin)
     */
    static cancelOrder(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /orders/statistics — статистика заказов (admin)
     */
    static getStatistics(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=OrderController.d.ts.map