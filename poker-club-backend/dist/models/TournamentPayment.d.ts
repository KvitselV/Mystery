import { PlayerProfile } from './PlayerProfile';
import { Tournament } from './Tournament';
/**
 * Оплата счёта игрока за турнир: наличные и/или безнал.
 * Сумма списывается с турнирного баланса (вход + ребаи + аддоны + заказы).
 */
export declare class TournamentPayment {
    id: string;
    playerProfile: PlayerProfile;
    playerProfileId: string;
    tournament: Tournament;
    tournamentId: string;
    cashAmount: number;
    nonCashAmount: number;
    createdAt: Date;
}
//# sourceMappingURL=TournamentPayment.d.ts.map