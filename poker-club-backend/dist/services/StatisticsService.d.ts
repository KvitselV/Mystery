import { PlayerProfile } from '../models/PlayerProfile';
import { Tournament } from '../models/Tournament';
export declare class StatisticsService {
    private static instance;
    private profileRepo;
    private resultRepo;
    private tournamentRepo;
    private registrationRepo;
    private pokerStats;
    static getInstance(): StatisticsService;
    updatePlayerStatistics(userId: string, tournamentId: string): Promise<void>;
    /**
     * Рассчитать процент финальных столов (ITM / final table rate).
     * Сохраняется в profile.winRate.
     */
    private calculateFinalTableRate;
    /**
     * Рассчитать среднее место финиша
     */
    private calculateAverageFinish;
    /**
     * Получить наиболее часто играемый турнир
     */
    private getMostPlayedTournament;
    /**
     * Пересчитать streak по всем результатам в хронологическом порядке.
     * «В призах» = финальный стол (isFinalTable).
     */
    private recalculateStreak;
    /**
     * Получить последние N выступлений (дата, место, всего участников)
     * @deprecated Специфичная логика; для универсальной статистики используйте PokerStatisticsService
     */
    getLastPerformances(playerProfileId: string, limit?: number): Promise<{
        date: string;
        place: number;
        totalPlayers: number;
        tournamentId: string;
    }[]>;
    /**
     * Победы в турнирах серий (1-е место, турнир с seriesId)
     * @deprecated Специфичная логика; для универсальной статистики используйте PokerStatisticsService
     */
    getSeriesWins(playerProfileId: string): Promise<number>;
    /**
     * Получить полную статистику игрока (по playerProfileId)
     * @deprecated Используйте PokerStatisticsService + profile/lastTournament по необходимости
     */
    getPlayerFullStatistics(playerProfileId: string): Promise<{
        profile: PlayerProfile | null;
        finishes: {
            first: number;
            second: number;
            third: number;
            others: number;
        };
        participationChart: {
            month: string;
            count: number;
        }[];
        lastTournament: Tournament | null;
        tournamentsPlayed: number;
        winPercentage: number;
        itmRate: number;
        averageFinish: number;
        bestFinish: number | null;
        last7Performances: {
            date: string;
            place: number;
            totalPlayers: number;
            tournamentId: string;
        }[];
        seriesWins: number;
        bestStreak: number;
    }>;
    /**
     * Получить статистику финишей игрока
     * @deprecated Используйте PokerStatisticsService.getPlayerStatisticsByProfileId с метриками wins, secondPlaces, thirdPlaces
     */
    getFinishStatistics(playerProfileId: string): Promise<{
        first: number;
        second: number;
        third: number;
        others: number;
    }>;
    /**
     * Получить график участия (по месяцам)
     * @deprecated Используйте PokerStatisticsService.getPlayerStatisticsByProfileId с метрикой participationByMonth
     */
    getParticipationChart(playerProfileId: string): Promise<{
        month: string;
        count: number;
    }[]>;
    /**
     * Получить последний сыгранный турнир
     * @deprecated Специфичная логика; для универсальной статистики используйте PokerStatisticsService
     */
    getLastTournament(playerProfileId: string): Promise<Tournament | null>;
}
//# sourceMappingURL=StatisticsService.d.ts.map