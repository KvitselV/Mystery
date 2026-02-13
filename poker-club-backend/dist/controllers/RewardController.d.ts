import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class RewardController {
    static create(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getRewards(req: AuthRequest, res: Response): Promise<void>;
    static getById(req: AuthRequest, res: Response): Promise<void>;
    static update(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static delete(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=RewardController.d.ts.map