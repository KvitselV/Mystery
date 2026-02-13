import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class LiveTournamentController {
    static rebuy(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static addon(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /tournaments/:id/player/:playerId/eliminate - Выбытие игрока
     * Только для администраторов
     */
    static eliminatePlayer(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PATCH /tournaments/:id/level/next - Перейти на следующий уровень
     * Только для администраторов
     */
    static moveToNextLevel(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /tournaments/:id/level/current - Получить текущий уровень
     */
    static getCurrentLevel(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /tournaments/:id/player/:playerId/operations - История операций игрока
     */
    static getPlayerOperations(req: AuthRequest, res: Response): Promise<void>;
    /**
     * POST /tournaments/:id/finish - Завершить турнир
     * Только для администраторов
     */
    static finishTournament(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=LiveTournamentController.d.ts.map