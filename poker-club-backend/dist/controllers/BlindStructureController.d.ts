import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class BlindStructureController {
    /**
     * POST /blind-structures - Создать структуру блайндов
     * Только для администраторов
     */
    static createStructure(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /blind-structures - Получить все структуры
     */
    static getAllStructures(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /blind-structures/:id - Получить структуру по ID
     */
    static getStructureById(req: AuthRequest, res: Response): Promise<void>;
    /**
     * POST /blind-structures/:id/levels - Добавить уровень к структуре
     * Только для администраторов
     */
    static addLevel(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /blind-structures/:id/levels/with-coefficient - Добавить уровень по коэффициенту
     */
    static addLevelWithCoefficient(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * DELETE /blind-structures/:id - Деактивировать структуру
     * Только для администраторов
     */
    static deactivateStructure(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=BlindStructureController.d.ts.map