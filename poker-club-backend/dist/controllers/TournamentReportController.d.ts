import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class TournamentReportController {
    /**
     * GET /tournaments/:id/admin-report — Отчёт для администратора
     */
    static getAdminReport(req: AuthRequest, res: Response): Promise<void>;
    /**
     * PATCH /tournaments/:id/admin-report — Обновить отчёт (можно заполнять позже)
     */
    static updateAdminReport(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /tournaments/:id/player-results — Результаты для игроков (место, очки)
     */
    static getPlayerResults(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=TournamentReportController.d.ts.map