import { LeaderboardEntry } from './LeaderboardEntry';
export type LeaderboardType = 'TOURNAMENT_SERIES' | 'SEASONAL' | 'RANK_MMR';
export declare class Leaderboard {
    id: string;
    name: string;
    type: LeaderboardType;
    periodStart: Date | null;
    periodEnd: Date | null;
    seriesId: string | null;
    entries: LeaderboardEntry[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Leaderboard.d.ts.map