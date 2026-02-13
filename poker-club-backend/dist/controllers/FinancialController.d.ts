import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare class FinancialController {
    /**
     * Вспомогательный метод: получить PlayerProfile.id по User.id
     */
    private static getPlayerProfileId;
    /**
     * GET /user/deposit - Получить баланс депозита
     */
    static getDeposit(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /user/deposit/topup - Пополнить депозит
     */
    static topupDeposit(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /user/operations - Получить историю операций
     */
    static getOperations(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=FinancialController.d.ts.map