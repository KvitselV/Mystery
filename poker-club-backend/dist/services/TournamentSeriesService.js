"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentSeriesService = void 0;
const typeorm_1 = require("typeorm");
const database_1 = require("../config/database");
const TournamentSeries_1 = require("../models/TournamentSeries");
const LeaderboardService_1 = require("./LeaderboardService");
const TournamentService_1 = require("./TournamentService");
class TournamentSeriesService {
    constructor() {
        this.seriesRepository = database_1.AppDataSource.getRepository(TournamentSeries_1.TournamentSeries);
        this.leaderboardService = new LeaderboardService_1.LeaderboardService();
        this.tournamentService = new TournamentService_1.TournamentService();
    }
    async createSeries(data) {
        const clubId = data.clubId;
        if (!clubId)
            throw new Error('clubId is required');
        const daysStr = data.daysOfWeek?.length
            ? data.daysOfWeek.sort((a, b) => a - b).join(',')
            : '1,2,3,4,5,6';
        const series = this.seriesRepository.create({
            name: data.name,
            periodStart: data.periodStart,
            periodEnd: data.periodEnd,
            daysOfWeek: daysStr,
            clubId,
        });
        const saved = await this.seriesRepository.save(series);
        await this.leaderboardService.getOrCreateLeaderboard(data.name, 'TOURNAMENT_SERIES', data.periodStart, data.periodEnd, saved.id);
        // Автосоздание турниров от первого дня до финального по daysOfWeek
        const daysOfWeekArr = daysStr.split(',').map((s) => parseInt(s, 10));
        const startTimeStr = data.defaultStartTime || '19:00';
        const [hh, mm] = startTimeStr.split(':').map((s) => parseInt(s, 10) || 0);
        const buyIn = data.defaultBuyIn ?? 3000;
        const startingStack = data.defaultStartingStack ?? 10000;
        const start = new Date(data.periodStart);
        start.setHours(0, 0, 0, 0);
        const end = new Date(data.periodEnd);
        end.setHours(23, 59, 59, 999);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            if (!daysOfWeekArr.includes(dayOfWeek))
                continue;
            const startTime = new Date(d);
            startTime.setHours(hh, mm, 0, 0);
            const nameSuffix = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
            const tournamentName = `${data.name} - ${nameSuffix}`;
            await this.tournamentService.createTournament({
                name: tournamentName,
                seriesId: saved.id,
                clubId,
                startTime,
                buyInCost: buyIn,
                startingStack,
                blindStructureId: data.defaultBlindStructureId,
            });
        }
        return this.getSeriesById(saved.id);
    }
    async getAllSeries(clubFilter) {
        const series = await this.seriesRepository.find({
            where: clubFilter ? { clubId: clubFilter } : {},
            order: { periodStart: 'DESC' },
            relations: ['tournaments'],
        });
        if (clubFilter) {
            const global = await this.seriesRepository.find({
                where: { clubId: (0, typeorm_1.IsNull)() },
                order: { periodStart: 'DESC' },
                relations: ['tournaments'],
            });
            return [...series, ...global].sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime());
        }
        return series;
    }
    async getSeriesById(id) {
        const s = await this.seriesRepository.findOne({
            where: { id },
            relations: ['tournaments'],
        });
        if (!s)
            throw new Error('Series not found');
        return s;
    }
    async ensureCanModify(id, managedClubId) {
        const series = await this.getSeriesById(id);
        if (managedClubId && series.clubId !== managedClubId) {
            throw new Error('Forbidden: series belongs to another club');
        }
        return series;
    }
    async updateSeries(id, data, managedClubId) {
        await this.ensureCanModify(id, managedClubId);
        const series = await this.getSeriesById(id);
        if (data.name)
            series.name = data.name;
        if (data.periodStart)
            series.periodStart = data.periodStart;
        if (data.periodEnd)
            series.periodEnd = data.periodEnd;
        if (data.daysOfWeek?.length)
            series.daysOfWeek = data.daysOfWeek.sort((a, b) => a - b).join(',');
        return this.seriesRepository.save(series);
    }
    async deleteSeries(id, managedClubId) {
        const series = await this.ensureCanModify(id, managedClubId);
        if (series.tournaments?.length) {
            for (const t of series.tournaments) {
                await this.tournamentService.deleteTournament(t.id, undefined, { force: true });
            }
        }
        await this.seriesRepository.remove(series);
    }
    getDaysOfWeekArray(series) {
        return series.daysOfWeek
            ? series.daysOfWeek.split(',').map((s) => parseInt(s, 10))
            : [];
    }
}
exports.TournamentSeriesService = TournamentSeriesService;
//# sourceMappingURL=TournamentSeriesService.js.map