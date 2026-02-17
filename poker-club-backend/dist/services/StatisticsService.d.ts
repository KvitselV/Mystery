import { PlayerProfile } from '../models/PlayerProfile';
import { Tournament } from '../models/Tournament';
export declare class StatisticsService {
    private profileRepo;
    private resultRepo;
    private tournamentRepo;
    private registrationRepo;
    updatePlayerStatistics(userId: string, tournamentId: string): Promise<void>;
    /**
     * Рассчитать процент финальных столов (winRate)
     */
    private calculateWinRate;
    /**
     * Рассчитать среднее место финиша
     */
    private calculateAverageFinish;
    /**
     * Получить наиболее часто играемый турнир
     */
    private getMostPlayedTournament;
    /**
     * Обновить серию финишей в призах
     */
    private updateStreak;
    /**
     * Получить последние N выступлений (дата, место, всего участников)
     */
    getLastPerformances(playerProfileId: string, limit?: number): Promise<{
        date: string;
        place: number;
        totalPlayers: number;
        tournamentId: string;
    }[]>;
    /**
     * Победы в турнирах серий (1-е место, турнир с seriesId)
     */
    getSeriesWins(playerProfileId: string): Promise<number>;
    /**
     * Получить полную статистику игрока (по playerProfileId)
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
     */
    getFinishStatistics(playerProfileId: string): Promise<{
        first: number;
        second: number;
        third: number;
        others: number;
    }>;
    /**
     * Получить график участия (по месяцам)
     */
    getParticipationChart(playerProfileId: string): Promise<{
        month: string;
        count: number;
    }[]>;
    /**
     * Получить последний сыгранный турнир
     */
    getLastTournament(playerProfileId: string): Promise<Tournament | null>;
}
//# sourceMappingURL=StatisticsService.d.ts.map