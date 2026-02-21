import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class AdminDataController {
    /**
     * GET /admin/data — Все данные из БД (только ADMIN)
     */
    static getAllData(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PATCH /admin/entity/:table/:id — Обновить запись (только ADMIN)
     */
    static updateEntity(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /admin/import-excel — Импорт данных из Excel (только ADMIN)
     */
    static importExcel(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /admin/recalculate-ratings — Пересчитать все рейтинги по новой системе очков (только ADMIN)
     */
    static recalculateRatings(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=AdminDataController.d.ts.map