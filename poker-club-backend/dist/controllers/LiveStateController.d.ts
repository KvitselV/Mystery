import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class LiveStateController {
    /**
     * GET /tournaments/:id/live - Получить Live State турнира
     */
    static getLiveState(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PATCH /tournaments/:id/pause - Поставить турнир на паузу
     * Только для администраторов
     */
    static pauseTournament(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PATCH /tournaments/:id/resume - Возобновить турнир
     * Только для администраторов
     */
    static resumeTournament(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PATCH /tournaments/:id/live/recalculate - Пересчитать статистику
     * Только для администраторов
     */
    static recalculateStats(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PATCH /tournaments/:id/live/time - Обновить оставшееся время
     * Только для администраторов
     */
    static updateLevelTime(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=LiveStateController.d.ts.map