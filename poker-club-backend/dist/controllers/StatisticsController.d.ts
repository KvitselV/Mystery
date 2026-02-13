import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class StatisticsController {
    /**
     * GET /statistics/user/:userId — только свой профиль или ADMIN
     */
    static getFullStatistics(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /statistics/user/:userId/finishes
     */
    static getFinishStatistics(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /statistics/user/:userId/participation
     */
    static getParticipationChart(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /statistics/user/:userId/last-tournament
     */
    static getLastTournament(req: AuthRequest, res: Response): Promise<void>;
    /**
     * POST /statistics/user/:userId/update — только ADMIN (requireRole в роуте)
     */
    static updateStatistics(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=StatisticsController.d.ts.map