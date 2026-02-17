import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class LiveTournamentController {
    static rebuy(req: AuthRequest, res: Response): Promise<void>;
    static addon(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static eliminatePlayer(req: AuthRequest, res: Response): Promise<void>;
    static returnEliminatedPlayer(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PATCH /tournaments/:id/level/next - Перейти на следующий уровень
     * Только для администраторов
     */
    static moveToNextLevel(req: AuthRequest, res: Response): Promise<void>;
    /**
     * PATCH /tournaments/:id/level/prev - Перейти на предыдущий уровень
     */
    static moveToPrevLevel(req: AuthRequest, res: Response): Promise<void>;
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
     * ADMIN: в любой момент. CONTROLLER: только когда остался 1 игрок после поздней регистрации
     */
    static finishTournament(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /tournaments/:id/player-balances - Балансы игроков (Controller, Admin)
     */
    static getPlayerBalances(req: AuthRequest, res: Response): Promise<void>;
    /**
     * POST /tournaments/:id/player/:playerId/pay - Оплата счёта игрока
     */
    static recordPayment(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=LiveTournamentController.d.ts.map