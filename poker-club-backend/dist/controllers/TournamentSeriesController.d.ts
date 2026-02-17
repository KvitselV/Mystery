import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class TournamentSeriesController {
    static create(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getAll(req: AuthRequest, res: Response): Promise<void>;
    static getById(req: AuthRequest, res: Response): Promise<void>;
    static update(req: AuthRequest, res: Response): Promise<void>;
    static delete(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /tournament-series/:id/rating-table — Таблица рейтинга серии
     */
    static getRatingTable(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=TournamentSeriesController.d.ts.map