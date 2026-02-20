import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class AchievementController {
    static getAllTypes(req: AuthRequest, res: Response): Promise<void>;
    static getUserAchievements(req: AuthRequest, res: Response): Promise<void>;
    static getUserProgress(req: AuthRequest, res: Response): Promise<void>;
    /**
     * POST /achievements/check — только ADMIN (requireRole в роуте)
     */
    static checkAchievements(req: AuthRequest, res: Response): Promise<void>;
    /**
     * POST /achievements/seed — только ADMIN
     */
    static seedTypes(req: AuthRequest, res: Response): Promise<void>;
    /**
     * POST /achievements/types — создать тип достижения (только ADMIN)
     */
    static createType(req: AuthRequest, res: Response): Promise<void>;
    /**
     * DELETE /achievements/instances/:id — отозвать достижение (только ADMIN)
     */
    static revokeInstance(req: AuthRequest, res: Response): Promise<void>;
    /**
     * PATCH /achievements/user/:userId/pins — установить закреплённые достижения (до 4)
     */
    static setPins(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /achievements/profile/:playerProfileId — получить достижения по playerProfileId (доступно всем авторизованным)
     */
    static getAchievementsByPlayerProfileId(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=AchievementController.d.ts.map