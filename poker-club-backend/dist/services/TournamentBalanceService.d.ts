import { TournamentPayment } from '../models/TournamentPayment';
export interface TournamentPlayerBalance {
    playerId: string;
    playerName: string;
    balance: number;
    buyInAmount: number;
    rebuysAmount: number;
    addonsAmount: number;
    ordersAmount: number;
    paidAmount: number;
}
export declare class TournamentBalanceService {
    private tournamentRepo;
    private registrationRepo;
    private operationRepo;
    private orderRepo;
    private paymentRepo;
    /**
     * Баланс игрока = вход + ребаи + аддоны + заказы - оплаты
     */
    getTournamentPlayerBalances(tournamentId: string): Promise<TournamentPlayerBalance[]>;
    recordPayment(tournamentId: string, playerProfileId: string, cashAmount: number, nonCashAmount: number): Promise<TournamentPayment>;
}
//# sourceMappingURL=TournamentBalanceService.d.ts.map