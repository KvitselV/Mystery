import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class ClubController {
    /**
     * POST /clubs - Создать клуб (только админ)
     */
    static createClub(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /clubs - Получить список клубов
     */
    static getClubs(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /clubs/:id - Получить клуб по ID
     */
    static getClubById(req: AuthRequest, res: Response): Promise<void>;
    /**
     * PATCH /clubs/:id - Обновить клуб (только админ)
     */
    static updateClub(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * DELETE /clubs/:id - Удалить клуб (только админ)
     */
    static deleteClub(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /clubs/:id/tables - Получить столы клуба
     */
    static getClubTables(req: AuthRequest, res: Response): Promise<void>;
    /**
     * PATCH /clubs/:id/tables/:tableId/status - Обновить статус стола (только админ)
     */
    static updateTableStatus(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /clubs/:id/schedules - Добавить расписание (только админ)
     */
    static addSchedule(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /clubs/:id/schedules - Получить расписание клуба
     */
    static getClubSchedules(req: AuthRequest, res: Response): Promise<void>;
    /**
     * PATCH /clubs/:id/schedules/:scheduleId - Обновить расписание (только админ)
     */
    static updateSchedule(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * DELETE /clubs/:id/schedules/:scheduleId - Удалить расписание (только админ)
     */
    static deleteSchedule(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=ClubController.d.ts.map