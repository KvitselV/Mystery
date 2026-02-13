import { User } from './User';
import { PlayerBalance } from './PlayerBalance';
export declare class PlayerProfile {
    id: string;
    user: User;
    mmrValue: number;
    rankCode: string;
    tournamentsCount: number;
    winRate: number;
    averageFinish: number;
    bestFinish?: number;
    favoriteTournamentId?: string;
    currentStreak: number;
    bestStreak: number;
    balance: PlayerBalance;
}
//# sourceMappingURL=PlayerProfile.d.ts.map