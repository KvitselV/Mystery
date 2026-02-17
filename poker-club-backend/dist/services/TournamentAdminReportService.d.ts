import { TournamentAdminReport, ExpenseItem } from '../models/TournamentAdminReport';
export declare class TournamentAdminReportService {
    private reportRepo;
    private tournamentRepo;
    private registrationRepo;
    private paymentRepo;
    getByTournamentId(tournamentId: string): Promise<TournamentAdminReport | null>;
    getOrCreate(tournamentId: string): Promise<TournamentAdminReport>;
    update(tournamentId: string, data: Partial<{
        attendanceCount: number;
        cashRevenue: number;
        nonCashRevenue: number;
        expenses: ExpenseItem[];
    }>): Promise<TournamentAdminReport>;
}
//# sourceMappingURL=TournamentAdminReportService.d.ts.map