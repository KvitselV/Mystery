import { Leaderboard } from '../models/Leaderboard';
import { LeaderboardEntry } from '../models/LeaderboardEntry';
export declare class LeaderboardService {
    private leaderboardRepository;
    private entryRepository;
    private resultRepository;
    private tournamentRepository;
    private playerRepository;
    /**
     * Создать или получить рейтинг
     */
    getOrCreateLeaderboard(name: string, type: 'TOURNAMENT_SERIES' | 'SEASONAL' | 'RANK_MMR', periodStart?: Date, periodEnd?: Date, seriesId?: string): Promise<Leaderboard>;
    /**
     * Получить или создать запись игрока в рейтинге
     */
    getOrCreateEntry(leaderboardId: string, playerProfileId: string): Promise<LeaderboardEntry>;
    /**
     * Обновить запись игрока в рейтинге после турнира
     */
    updateLeaderboardEntry(leaderboardId: string, playerProfileId: string, finishPosition: number, totalPlayers: number, points: number): Promise<LeaderboardEntry>;
    /**
     * Пересчитать позиции в рейтинге
     */
    recalculateRankPositions(leaderboardId: string): Promise<void>;
    /**
     * Получить записи рейтинга
     */
    getLeaderboardEntries(leaderboardId: string, limit?: number, offset?: number): Promise<LeaderboardEntry[]>;
    /**
     * Получить все рейтинги
     */
    getAllLeaderboards(): Promise<Leaderboard[]>;
    /**
     * Создать сезонный рейтинг для текущего месяца
     */
    createSeasonalLeaderboard(): Promise<Leaderboard>;
    /**
     * Создать рейтинг по ММР
     */
    createRankMMRLeaderboard(): Promise<Leaderboard>;
    /**
     * Обновить рейтинг по ММР
     */
    updateRankMMRLeaderboard(): Promise<void>;
    /**
     * Обновить все релевантные рейтинги после завершения турнира
     */
    updateLeaderboardsAfterTournament(tournamentId: string): Promise<void>;
    /**
     * Рассчитать очки за финиш
     */
    private calculatePoints;
}
//# sourceMappingURL=LeaderboardService.d.ts.map