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
     * POST /achievements/seed — только ADMIN (requireRole в роуте)
     */
    static seedTypes(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=AchievementController.d.ts.map