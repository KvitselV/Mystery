import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class AuthController {
    static register(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static login(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static refresh(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getMe(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=AuthController.d.ts.map