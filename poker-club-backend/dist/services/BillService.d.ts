import { PlayerBill, PlayerBillStatus } from '../models/PlayerBill';
export declare class BillService {
    private billRepo;
    private profileRepo;
    /**
     * Счета текущего пользователя (по userId)
     */
    getBillsByUserId(userId: string): Promise<PlayerBill[]>;
    /**
     * Один счёт по id; проверка, что счёт принадлежит пользователю (или любой для admin)
     */
    getBillById(billId: string, userId: string, isAdmin: boolean): Promise<PlayerBill | null>;
    /**
     * Все счета (админ), с опциональными фильтрами
     */
    getAllBills(filters?: {
        tournamentId?: string;
        playerProfileId?: string;
        status?: PlayerBillStatus;
        limit?: number;
        offset?: number;
    }): Promise<{
        bills: PlayerBill[];
        total: number;
    }>;
    /**
     * Обновить статус счёта (оплачен) — только админ
     */
    updateBillStatus(billId: string, status: PlayerBillStatus): Promise<PlayerBill>;
}
//# sourceMappingURL=BillService.d.ts.map