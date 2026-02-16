import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class SeatingController {
    static initTablesFromClub(req: AuthRequest, res: Response): Promise<void>;
    static autoSeating(req: AuthRequest, res: Response): Promise<void>;
    static manualReseating(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /tournaments/:id/tables - Получить все столы турнира
     * Admin/Controller: все столы. Гости: только столы с игроками (occupiedSeats > 0).
     */
    static getTournamentTables(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /tournaments/:tournamentId/tables/:tableId - Получить детали стола
     * Доступно администраторам и клиентам
     */
    static getTableDetails(req: AuthRequest, res: Response): Promise<void>;
    /**
     * POST /tournaments/:id/player/:playerId/eliminate - Исключить игрока
     * Только для администраторов
     */
    static eliminatePlayer(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=SeatingController.d.ts.map