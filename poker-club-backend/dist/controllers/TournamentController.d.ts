import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class TournamentController {
    static createTournament(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /tournaments - Получить список турниров
     */
    static getTournaments(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /tournaments/:id - Получить турнир по ID
     */
    static getTournamentById(req: AuthRequest, res: Response): Promise<void>;
    /**
     * PATCH /tournaments/:id/rewards - Обновить награды турнира (ADMIN)
     */
    static updateTournamentRewards(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /tournaments/:id/register - Зарегистрироваться на турнир
     */
    static registerForTournament(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /tournaments/:id/players - Получить участников турнира
     */
    static getTournamentPlayers(req: AuthRequest, res: Response): Promise<void>;
    /**
     * PATCH /tournaments/:id/status - Изменить статус турнира (только админ)
     */
    static updateTournamentStatus(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
   * DELETE /tournaments/:id/register - Отменить регистрацию
   */
    static unregisterFromTournament(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=TournamentController.d.ts.map