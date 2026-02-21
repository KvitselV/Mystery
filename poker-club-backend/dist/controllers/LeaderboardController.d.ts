import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class LeaderboardController {
    /**
     * GET /leaderboards - Получить все рейтинги
     */
    static getAllLeaderboards(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /leaderboards/:id/entries - Получить записи рейтинга
     */
    static getLeaderboardEntries(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /leaderboards/seasonal/create - Создать сезонный рейтинг
     * Только для администраторов
     */
    static createSeasonalLeaderboard(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /leaderboards/rank-mmr/update - Обновить рейтинг по ММР
     * Только для администраторов
     */
    static updateRankMMRLeaderboard(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /leaderboards/period-ratings - Рейтинг за период (неделя / месяц / год)
     */
    static getPeriodRatings(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /leaderboards/rank-mmr - Получить топ по рангам
     */
    static getRankMMRLeaderboard(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=LeaderboardController.d.ts.map