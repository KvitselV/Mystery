import { Tournament } from './Tournament';
export interface ExpenseItem {
    description: string;
    amount: number;
}
/**
 * Отчёт для администратора по завершённому турниру.
 * Можно заполнять/редактировать позже.
 */
export declare class TournamentAdminReport {
    id: string;
    tournament: Tournament;
    tournamentId: string;
    /** Сколько человек пришло (isArrived) */
    attendanceCount: number;
    /** Наличная выручка (копейки) — из TournamentPayment */
    cashRevenue: number;
    /** Безналичная выручка (копейки) — из TournamentPayment */
    nonCashRevenue: number;
    /** Расходы: [{ description, amount }], amount в копейках */
    expenses: ExpenseItem[];
    /** Итого прибыль (копейки) = cashRevenue + nonCashRevenue - sum(expenses.amount) */
    totalProfit: number;
}
//# sourceMappingURL=TournamentAdminReport.d.ts.map