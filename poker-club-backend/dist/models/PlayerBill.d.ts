import { PlayerProfile } from './PlayerProfile';
import { Tournament } from './Tournament';
export declare enum PlayerBillStatus {
    PENDING = "PENDING",// Счёт выставлен, ожидает оплаты
    PAID = "PAID"
}
/**
 * Счёт игроку после вылета: если он платил наличными (CASH), ему выставляется счёт
 * за вход (бай-ин), ребаи, аддоны и заказы в долг (CREDIT).
 */
export declare class PlayerBill {
    id: string;
    playerProfile: PlayerProfile;
    playerProfileId: string;
    tournament: Tournament;
    tournamentId: string;
    amount: number;
    buyInAmount: number;
    rebuysAmount: number;
    addonsAmount: number;
    ordersAmount: number;
    status: PlayerBillStatus;
    createdAt: Date;
}
//# sourceMappingURL=PlayerBill.d.ts.map