import { StatisticsResult } from './types';
export type PokerMetricName = 'tournamentsPlayed' | 'wins' | 'secondPlaces' | 'thirdPlaces' | 'averageFinish' | 'bestFinish' | 'finalTableRate' | 'winRate' | 'participationByMonth' | 'tournamentDistribution' | 'finalTableCount' | 'seriesWins';
export declare const POKER_METRIC_NAMES: PokerMetricName[];
export declare class PokerStatisticsService {
    private static instance;
    private universalService;
    private profileRepo;
    static getInstance(): PokerStatisticsService;
    constructor();
    private resolvePlayerProfileId;
    /**
     * Получить статистику игрока по userId
     */
    getPlayerStatistics(userId: string, timeRange?: {
        from: Date;
        to: Date;
    }, requestedMetrics?: string[]): Promise<StatisticsResult | null>;
    /**
     * Получить статистику игрока по playerProfileId
     */
    getPlayerStatisticsByProfileId(playerProfileId: string, timeRange?: {
        from: Date;
        to: Date;
    }, requestedMetrics?: string[]): Promise<StatisticsResult>;
    /**
     * Сравнить статистику нескольких игроков
     */
    comparePlayerStatistics(userIds: string[], requestedMetrics?: string[]): Promise<Map<string, StatisticsResult | null>>;
    getAvailableMetrics(): string[];
}
//# sourceMappingURL=PokerStatisticsService.d.ts.map