import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
        managedClubId?: string | null;
    };
}
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requireRole: (roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/** ADMIN — полный доступ. CONTROLLER — доступ только к своему клубу (managedClubId обязателен) */
export declare const requireAdminOrController: () => (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/** Только ADMIN — управление клубами и глобальные настройки */
export declare const requireAdmin: () => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=authMiddleware.d.ts.map