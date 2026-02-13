import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class SeatingController {
    /**
     * POST /tournaments/:id/tables/init-from-club - Создать столы турнира из столов клуба
     * Только для администраторов. Вызывать при запуске турнира (турнир должен быть привязан к клубу).
     */
    static initTablesFromClub(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /tournaments/:id/seating/auto - Автоматическая рассадка
     * Только для администраторов
     */
    static autoSeating(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /tournaments/:id/seating/manual - Ручная пересадка игрока
     * Только для администраторов
     */
    static manualReseating(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /tournaments/:id/tables - Получить все столы турнира
     * Доступно администраторам и клиентам
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