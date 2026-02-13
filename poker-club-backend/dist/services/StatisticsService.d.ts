import { PlayerProfile } from '../models/PlayerProfile';
import { Tournament } from '../models/Tournament';
export declare class StatisticsService {
    private profileRepo;
    private resultRepo;
    private tournamentRepo;
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