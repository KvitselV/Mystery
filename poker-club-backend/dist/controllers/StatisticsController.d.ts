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
    /**
     * GET /statistics/profile/:playerProfileId — получить профиль по playerProfileId (доступно всем авторизованным)
     */
    static getProfileByPlayerProfileId(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /statistics/player/:userId — статистика с фильтрами (from, to, metrics)
     */
    static getPlayerStatisticsWithFilters(req: AuthRequest, res: Response): Promise<void>;
    /**
     * POST /statistics/compare — сравнить статистику нескольких игроков
     */
    static comparePlayerStatistics(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /statistics/user/:userId/public — получить профиль по userId (доступно всем авторизованным, для просмотра чужих профилей)
     */
    static getPublicProfileByUserId(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=StatisticsController.d.ts.map