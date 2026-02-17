"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentAdminReportService = void 0;
const database_1 = require("../config/database");
const TournamentAdminReport_1 = require("../models/TournamentAdminReport");
const Tournament_1 = require("../models/Tournament");
const TournamentRegistration_1 = require("../models/TournamentRegistration");
const TournamentPayment_1 = require("../models/TournamentPayment");
class TournamentAdminReportService {
    constructor() {
        this.reportRepo = database_1.AppDataSource.getRepository(TournamentAdminReport_1.TournamentAdminReport);
        this.tournamentRepo = database_1.AppDataSource.getRepository(Tournament_1.Tournament);
        this.registrationRepo = database_1.AppDataSource.getRepository(TournamentRegistration_1.TournamentRegistration);
        this.paymentRepo = database_1.AppDataSource.getRepository(TournamentPayment_1.TournamentPayment);
    }
    async getByTournamentId(tournamentId) {
        return this.reportRepo.findOne({
            where: { tournamentId },
            relations: ['tournament'],
        });
    }
    async getOrCreate(tournamentId) {
        let report = await this.getByTournamentId(tournamentId);
        if (!report) {
            const tournament = await this.tournamentRepo.findOne({ where: { id: tournamentId } });
            if (!tournament)
                throw new Error('Tournament not found');
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
    async update(tournamentId, data) {
        let report = await this.getByTournamentId(tournamentId);
        if (!report)
            report = await this.getOrCreate(tournamentId);
        if (data.attendanceCount !== undefined)
            report.attendanceCount = data.attendanceCount;
        if (data.cashRevenue !== undefined)
            report.cashRevenue = data.cashRevenue;
        if (data.nonCashRevenue !== undefined)
            report.nonCashRevenue = data.nonCashRevenue;
        if (data.expenses !== undefined)
            report.expenses = data.expenses;
        const totalExpenses = (report.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
        report.totalProfit = report.cashRevenue + report.nonCashRevenue - totalExpenses;
        return this.reportRepo.save(report);
    }
}
exports.TournamentAdminReportService = TournamentAdminReportService;
//# sourceMappingURL=TournamentAdminReportService.js.map