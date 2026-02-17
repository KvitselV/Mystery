import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class AuthController {
    static register(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static login(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static logout(req: Request, res: Response): Promise<void>;
    static getMe(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static updateProfile(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static promoteToAdmin(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static assignControllerToClub(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getUsers(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static promoteToController(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=AuthController.d.ts.map