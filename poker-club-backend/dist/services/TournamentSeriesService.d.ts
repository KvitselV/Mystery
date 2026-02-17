import { TournamentSeries } from '../models/TournamentSeries';
export declare class TournamentSeriesService {
    private seriesRepository;
    private leaderboardService;
    private tournamentService;
    createSeries(data: {
        name: string;
        periodStart: Date;
        periodEnd: Date;
        daysOfWeek?: number[];
        clubId: string | null;
        defaultStartTime?: string;
        defaultBuyIn?: number;
        defaultStartingStack?: number;
        defaultBlindStructureId?: string;
        defaultAddonChips?: number;
        defaultAddonCost?: number;
        defaultRebuyChips?: number;
        defaultRebuyCost?: number;
        defaultMaxRebuys?: number;
        defaultMaxAddons?: number;
    }): Promise<TournamentSeries>;
    getAllSeries(clubFilter?: string | null): Promise<TournamentSeries[]>;
    getSeriesById(id: string): Promise<TournamentSeries>;
    ensureCanModify(id: string, managedClubId?: string | null): Promise<TournamentSeries>;
    updateSeries(id: string, data: Partial<{
        name: string;
        periodStart: Date;
        periodEnd: Date;
        daysOfWeek: number[];
    }>, managedClubId?: string | null): Promise<TournamentSeries>;
    deleteSeries(id: string, managedClubId?: string | null): Promise<void>;
    getDaysOfWeekArray(series: TournamentSeries): number[];
    /**
     * Таблица рейтинга серии: игроки, итого очков, очки по датам турниров.
     * Колонки: Имя (№ карты) | Итого | Дата1 | Дата2 | ... (новые даты добавляются в 3-ю колонку)
     */
    getSeriesRatingTable(seriesId: string): Promise<{
        seriesName: string;
        columns: {
            date: string;
            dateLabel: string;
        }[];
        rows: {
            playerId: string;
            playerName: string;
            clubCardNumber?: string;
            totalPoints: number;
            pointsByDate: Record<string, number>;
            positionByDate: Record<string, number>;
        }[];
    }>;
}
//# sourceMappingURL=TournamentSeriesService.d.ts.map