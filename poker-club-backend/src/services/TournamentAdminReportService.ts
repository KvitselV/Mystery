import { AppDataSource } from '../config/database';
import { TournamentAdminReport, ExpenseItem } from '../models/TournamentAdminReport';
import { Tournament } from '../models/Tournament';
import { TournamentRegistration } from '../models/TournamentRegistration';
import { TournamentPayment } from '../models/TournamentPayment';

export class TournamentAdminReportService {
  private reportRepo = AppDataSource.getRepository(TournamentAdminReport);
  private tournamentRepo = AppDataSource.getRepository(Tournament);
  private registrationRepo = AppDataSource.getRepository(TournamentRegistration);
  private paymentRepo = AppDataSource.getRepository(TournamentPayment);

  async getByTournamentId(tournamentId: string): Promise<TournamentAdminReport | null> {
    return this.reportRepo.findOne({
      where: { tournamentId },
      relations: ['tournament'],
    });
  }

  async getOrCreate(tournamentId: string): Promise<TournamentAdminReport> {
    let report = await this.getByTournamentId(tournamentId);
    if (!report) {
      const tournament = await this.tournamentRepo.findOne({ where: { id: tournamentId } });
      if (!tournament) throw new Error('Tournament not found');
      if (tournament.status !== 'ARCHIVED' && tournament.status !== 'FINISHED') {
        throw new Error('Report available only for archived/finished tournaments');
      }
      const arrivedCount = await this.registrationRepo.count({
        where: { tournament: { id: tournamentId }, isArrived: true },
      });
      const payments = await this.paymentRepo.find({ where: { tournamentId } });
      const cashRevenue = payments.reduce((s, p) => s + p.cashAmount, 0);
      const nonCashRevenue = payments.reduce((s, p) => s + p.nonCashAmount, 0);
      report = this.reportRepo.create({
        tournamentId,
        attendanceCount: arrivedCount,
        cashRevenue,
        nonCashRevenue,
        expenses: [],
        totalProfit: cashRevenue + nonCashRevenue,
      });
      await this.reportRepo.save(report);
    }
    return report;
  }

  async update(
    tournamentId: string,
    data: Partial<{
      attendanceCount: number;
      cashRevenue: number;
      nonCashRevenue: number;
      expenses: ExpenseItem[];
    }>
  ): Promise<TournamentAdminReport> {
    let report = await this.getByTournamentId(tournamentId);
    if (!report) report = await this.getOrCreate(tournamentId);

    if (data.attendanceCount !== undefined) report.attendanceCount = data.attendanceCount;
    if (data.cashRevenue !== undefined) report.cashRevenue = data.cashRevenue;
    if (data.nonCashRevenue !== undefined) report.nonCashRevenue = data.nonCashRevenue;
    if (data.expenses !== undefined) report.expenses = data.expenses;

    const totalExpenses = (report.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
    report.totalProfit = report.cashRevenue + report.nonCashRevenue - totalExpenses;

    return this.reportRepo.save(report);
  }
}
