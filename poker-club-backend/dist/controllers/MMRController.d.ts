import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class MMRController {
    /**
     * GET /mmr/top - Получить топ игроков по ММР
     */
    static getTopPlayers(req: AuthRequest, res: Response): Promise<void>;
    /**
    * GET /mmr/rank/:rankCode - Получить игроков по рангу
    */
    static getPlayersByRank(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /mmr/recalculate/:tournamentId - Пересчитать ММР для турнира
     * Только для администраторов
     */
    static recalculateTournamentMMR(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=MMRController.d.ts.map