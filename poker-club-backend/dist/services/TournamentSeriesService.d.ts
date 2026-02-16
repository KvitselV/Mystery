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
}
//# sourceMappingURL=TournamentSeriesService.d.ts.map