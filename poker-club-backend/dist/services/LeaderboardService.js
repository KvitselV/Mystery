"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardService = void 0;
const database_1 = require("../config/database");
const Leaderboard_1 = require("../models/Leaderboard");
const LeaderboardEntry_1 = require("../models/LeaderboardEntry");
const TournamentResult_1 = require("../models/TournamentResult");
const PlayerProfile_1 = require("../models/PlayerProfile");
const Tournament_1 = require("../models/Tournament");
const TournamentRegistration_1 = require("../models/TournamentRegistration");
const TournamentSeries_1 = require("../models/TournamentSeries");
class LeaderboardService {
    constructor() {
        this.leaderboardRepository = database_1.AppDataSource.getRepository(Leaderboard_1.Leaderboard);
        this.entryRepository = database_1.AppDataSource.getRepository(LeaderboardEntry_1.LeaderboardEntry);
        this.resultRepository = database_1.AppDataSource.getRepository(TournamentResult_1.TournamentResult);
        this.tournamentRepository = database_1.AppDataSource.getRepository(Tournament_1.Tournament);
        this.playerRepository = database_1.AppDataSource.getRepository(PlayerProfile_1.PlayerProfile);
        this.registrationRepository = database_1.AppDataSource.getRepository(TournamentRegistration_1.TournamentRegistration);
        this.seriesRepository = database_1.AppDataSource.getRepository(TournamentSeries_1.TournamentSeries);
    }
    /**
     * Создать или получить рейтинг
     */
    async getOrCreateLeaderboard(name, type, periodStart, periodEnd, seriesId) {
        const where = { type };
        if (seriesId)
            where.seriesId = seriesId;
        else
            where.name = name;
        let leaderboard = await this.leaderboardRepository.findOne({
            where: where,
        });
        if (!leaderboard) {
            leaderboard = this.leaderboardRepository.create({
                name,
                type,
                periodStart,
                periodEnd,
                seriesId,
            });
            await this.leaderboardRepository.save(leaderboard);
            console.log(`✅ Created leaderboard: ${name} (${type})`);
        }
        return leaderboard;
    }
    /**
     * Получить или создать запись игрока в рейтинге
     */
    async getOrCreateEntry(leaderboardId, playerProfileId) {
        let entry = await this.entryRepository.findOne({
            where: {
                leaderboard: { id: leaderboardId },
                playerProfile: { id: playerProfileId },
            },
            relations: ['leaderboard', 'playerProfile'],
        });
        if (!entry) {
            const leaderboard = await this.leaderboardRepository.findOne({
                where: { id: leaderboardId },
            });
            const player = await this.playerRepository.findOne({
                where: { id: playerProfileId },
            });
            if (!leaderboard || !player) {
                throw new Error('Leaderboard or player not found');
            }
            entry = this.entryRepository.create({
                leaderboard,
                playerProfile: player,
                rankPosition: 0,
                tournamentsCount: 0,
                averageFinish: 0,
                ratingPoints: 0,
            });
            await this.entryRepository.save(entry);
        }
        return entry;
    }
    /**
     * Обновить запись игрока в рейтинге после турнира
     */
    async updateLeaderboardEntry(leaderboardId, playerProfileId, finishPosition, totalPlayers, points) {
        const entry = await this.getOrCreateEntry(leaderboardId, playerProfileId);
        // Обновляем статистику
        entry.tournamentsCount += 1;
        // Пересчитываем средний финиш
        const totalFinishes = entry.averageFinish * (entry.tournamentsCount - 1) + finishPosition;
        entry.averageFinish = Math.round(totalFinishes / entry.tournamentsCount);
        // Добавляем очки
        entry.ratingPoints += points;
        await this.entryRepository.save(entry);
        // Пересчитываем позиции в рейтинге
        await this.recalculateRankPositions(leaderboardId);
        return entry;
    }
    /**
     * Пересчитать позиции в рейтинге
     */
    async recalculateRankPositions(leaderboardId) {
        const entries = await this.entryRepository.find({
            where: { leaderboard: { id: leaderboardId } },
            order: { ratingPoints: 'DESC' },
        });
        for (let i = 0; i < entries.length; i++) {
            entries[i].rankPosition = i + 1;
        }
        await this.entryRepository.save(entries);
    }
    /**
     * Получить записи рейтинга
     */
    async getLeaderboardEntries(leaderboardId, limit = 50, offset = 0) {
        return this.entryRepository.find({
            where: { leaderboard: { id: leaderboardId } },
            relations: ['playerProfile', 'playerProfile.user'],
            order: { rankPosition: 'ASC' },
            take: limit,
            skip: offset,
        });
    }
    /**
     * Получить все рейтинги (без удалённых серий)
     */
    async getAllLeaderboards() {
        const leaderboards = await this.leaderboardRepository.find({
            order: { createdAt: 'DESC' },
        });
        const seriesLbs = leaderboards.filter((lb) => lb.type === 'TOURNAMENT_SERIES' && lb.seriesId);
        const otherLbs = leaderboards.filter((lb) => lb.type !== 'TOURNAMENT_SERIES' || !lb.seriesId);
        if (seriesLbs.length === 0)
            return leaderboards;
        const existingSeriesIds = new Set((await this.seriesRepository.find({ select: { id: true } })).map((s) => s.id));
        const validSeriesLbs = seriesLbs.filter((lb) => lb.seriesId && existingSeriesIds.has(lb.seriesId));
        return [...validSeriesLbs, ...otherLbs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    /**
     * Удалить рейтинги серии (при удалении серии)
     */
    async deleteLeaderboardsBySeriesId(seriesId) {
        const leaderboards = await this.leaderboardRepository.find({
            where: { seriesId },
        });
        for (const lb of leaderboards) {
            await this.entryRepository.delete({ leaderboard: { id: lb.id } });
            await this.leaderboardRepository.remove(lb);
        }
        if (leaderboards.length > 0) {
            console.log(`🗑️ Deleted ${leaderboards.length} leaderboard(s) for series ${seriesId}`);
        }
    }
    /**
     * Создать сезонный рейтинг для текущего месяца
     */
    async createSeasonalLeaderboard() {
        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const name = `Seasonal ${periodStart.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
        return this.getOrCreateLeaderboard(name, 'SEASONAL', periodStart, periodEnd);
    }
    /**
     * Создать рейтинг по ММР
     */
    async createRankMMRLeaderboard() {
        return this.getOrCreateLeaderboard('Rank MMR Leaderboard', 'RANK_MMR');
    }
    /**
     * Обновить рейтинг по ММР
     */
    async updateRankMMRLeaderboard() {
        const leaderboard = await this.createRankMMRLeaderboard();
        // Получить всех игроков, отсортированных по ММР
        const players = await this.playerRepository.find({
            order: { mmrValue: 'DESC' },
        });
        // Очистить старые записи
        await this.entryRepository.delete({ leaderboard: { id: leaderboard.id } });
        // Создать новые записи
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            const entry = this.entryRepository.create({
                leaderboard,
                playerProfile: player,
                rankPosition: i + 1,
                tournamentsCount: 0, // Можно посчитать реально
                averageFinish: 0,
                ratingPoints: player.mmrValue,
            });
            await this.entryRepository.save(entry);
        }
        console.log(`✅ Updated Rank MMR Leaderboard with ${players.length} players`);
    }
    /**
     * Обновить все релевантные рейтинги после завершения турнира
     */
    async updateLeaderboardsAfterTournament(tournamentId) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
            relations: ['registrations', 'series'],
        });
        if (!tournament) {
            throw new Error('Tournament not found');
        }
        const results = await this.resultRepository.find({
            where: { tournament: { id: tournamentId } },
            relations: ['player'],
        });
        const totalPlayers = tournament.registrations.length;
        // Сохраняем очки в TournamentResult и обновляем рейтинги
        for (const result of results) {
            const points = this.calculatePoints(result.finishPosition, totalPlayers);
            result.points = points;
            await this.resultRepository.save(result);
        }
        // 1. Обновить рейтинг серии (если турнир в серии)
        if (tournament.series?.id) {
            const seriesLb = await this.getOrCreateLeaderboard(tournament.series.name, 'TOURNAMENT_SERIES', tournament.series.periodStart, tournament.series.periodEnd, tournament.series.id);
            for (const result of results) {
                await this.updateLeaderboardEntry(seriesLb.id, result.player.id, result.finishPosition, totalPlayers, result.points);
            }
        }
        // 2. Обновить сезонный рейтинг
        const seasonalLeaderboard = await this.createSeasonalLeaderboard();
        for (const result of results) {
            await this.updateLeaderboardEntry(seasonalLeaderboard.id, result.player.id, result.finishPosition, totalPlayers, result.points);
        }
        // 3. Обновить рейтинг по ММР
        await this.updateRankMMRLeaderboard();
        console.log(`✅ Updated leaderboards after tournament ${tournamentId}`);
    }
    /**
     * Рассчитать очки за финиш по таблице начисления
     */
    calculatePoints(finishPosition, totalPlayers) {
        const pos = finishPosition;
        const n = totalPlayers;
        if (n <= 9) {
            if (pos === 1)
                return 15;
            if (pos === 2)
                return 10;
            if (pos === 3)
                return 8;
            if (pos === 4)
                return 6;
            if (pos === 5)
                return 5;
            if (pos === 6)
                return 4;
            if (pos === 7)
                return 3;
            if (pos <= 9)
                return 2;
        }
        else if (n <= 14) {
            if (pos === 1)
                return 20;
            if (pos === 2)
                return 15;
            if (pos === 3)
                return 10;
            if (pos === 4)
                return 8;
            if (pos === 5)
                return 6;
            if (pos === 6)
                return 5;
            if (pos === 7)
                return 4;
            if (pos <= 9)
                return 3;
            if (pos <= 14)
                return 2;
        }
        else if (n <= 20) {
            if (pos === 1)
                return 25;
            if (pos === 2)
                return 20;
            if (pos === 3)
                return 15;
            if (pos === 4)
                return 10;
            if (pos === 5)
                return 8;
            if (pos === 6)
                return 6;
            if (pos === 7)
                return 5;
            if (pos <= 9)
                return 4;
            if (pos <= 14)
                return 3;
            if (pos <= 18)
                return 2;
            if (pos <= 20)
                return 1;
        }
        else if (n <= 25) {
            if (pos === 1)
                return 30;
            if (pos === 2)
                return 25;
            if (pos === 3)
                return 20;
            if (pos === 4)
                return 15;
            if (pos === 5)
                return 10;
            if (pos === 6)
                return 8;
            if (pos === 7)
                return 6;
            if (pos <= 9)
                return 5;
            if (pos <= 14)
                return 4;
            if (pos <= 18)
                return 3;
            if (pos <= 22)
                return 2;
            if (pos <= 25)
                return 1;
        }
        else if (n <= 30) {
            if (pos === 1)
                return 35;
            if (pos === 2)
                return 30;
            if (pos === 3)
                return 25;
            if (pos === 4)
                return 20;
            if (pos === 5)
                return 15;
            if (pos === 6)
                return 10;
            if (pos === 7)
                return 8;
            if (pos <= 9)
                return 6;
            if (pos <= 14)
                return 5;
            if (pos <= 18)
                return 4;
            if (pos <= 22)
                return 3;
            if (pos <= 27)
                return 2;
            if (pos <= 30)
                return 1;
        }
        else {
            // 31+ участников (для 31–35; при 36+ — те же правила, доп. места = 1 очко)
            if (pos === 1)
                return 40;
            if (pos === 2)
                return 35;
            if (pos === 3)
                return 30;
            if (pos === 4)
                return 25;
            if (pos === 5)
                return 20;
            if (pos === 6)
                return 15;
            if (pos === 7)
                return 10;
            if (pos <= 9)
                return 8;
            if (pos <= 14)
                return 7;
            if (pos <= 18)
                return 6;
            if (pos <= 22)
                return 5;
            if (pos <= 25)
                return 4;
            if (pos <= 27)
                return 3;
            if (pos <= 33)
                return 2;
            if (pos <= 35)
                return 1;
            return 1; // 36+ место
        }
        return 0;
    }
    /**
     * Пересчитать все рейтинги по новой системе очков.
     * Обновляет очки в результатах турниров и пересобирает серийные и сезонные рейтинги.
     */
    async recalculateAllRatings() {
        const tournaments = await this.tournamentRepository.find({
            where: { status: 'ARCHIVED' },
            relations: ['registrations', 'registrations.player', 'series'],
        });
        let updatedResults = 0;
        let createdMissing = 0;
        // 0. Создать недостающие результаты (игроки без результата — например, финальный стол при досрочном завершении)
        for (const tournament of tournaments) {
            const registrations = await this.registrationRepository.find({
                where: { tournament: { id: tournament.id } },
                relations: ['player'],
                order: { id: 'ASC' },
            });
            const existingResults = await this.resultRepository.find({
                where: { tournament: { id: tournament.id } },
                relations: ['player'],
            });
            const playerIdsWithResult = new Set(existingResults.map((r) => r.player?.id).filter(Boolean));
            const usedPositions = new Set(existingResults.map((r) => r.finishPosition));
            const missingRegs = registrations.filter((r) => r.player && !playerIdsWithResult.has(r.player.id));
            if (missingRegs.length === 0)
                continue;
            let nextPos = 1;
            while (usedPositions.has(nextPos))
                nextPos++;
            for (const reg of missingRegs) {
                if (!reg.player)
                    continue;
                const result = this.resultRepository.create({
                    tournament,
                    player: reg.player,
                    finishPosition: nextPos,
                    isFinalTable: nextPos <= 9,
                });
                await this.resultRepository.save(result);
                createdMissing++;
                usedPositions.add(nextPos);
                while (usedPositions.has(nextPos))
                    nextPos++;
            }
        }
        // 1. Пересчитать очки в TournamentResult для каждого завершённого турнира
        for (const tournament of tournaments) {
            const results = await this.resultRepository.find({
                where: { tournament: { id: tournament.id } },
                relations: ['player'],
            });
            const totalPlayers = tournament.registrations?.length ?? 0;
            if (totalPlayers === 0)
                continue;
            for (const result of results) {
                const points = this.calculatePoints(result.finishPosition, totalPlayers);
                result.points = points;
                await this.resultRepository.save(result);
                updatedResults++;
            }
        }
        // 2. Удалить все записи серийных и сезонных рейтингов
        const leaderboardsToReset = await this.leaderboardRepository.find({
            where: [
                { type: 'TOURNAMENT_SERIES' },
                { type: 'SEASONAL' },
            ],
        });
        for (const lb of leaderboardsToReset) {
            await this.entryRepository.delete({ leaderboard: { id: lb.id } });
        }
        // 3. Заново собрать рейтинги из результатов турниров
        for (const tournament of tournaments) {
            const results = await this.resultRepository.find({
                where: { tournament: { id: tournament.id } },
                relations: ['player'],
            });
            const totalPlayers = tournament.registrations?.length ?? 0;
            if (totalPlayers === 0 || results.length === 0)
                continue;
            // Серийный рейтинг
            if (tournament.series?.id) {
                const seriesLb = await this.getOrCreateLeaderboard(tournament.series.name, 'TOURNAMENT_SERIES', tournament.series.periodStart ?? undefined, tournament.series.periodEnd ?? undefined, tournament.series.id);
                for (const result of results) {
                    await this.updateLeaderboardEntry(seriesLb.id, result.player.id, result.finishPosition, totalPlayers, result.points);
                }
            }
            // Сезонный рейтинг (месяц турнира)
            const startDate = new Date(tournament.startTime);
            const periodStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
            const periodEnd = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
            const monthName = periodStart.toLocaleString('default', { month: 'long', year: 'numeric' });
            const seasonalLb = await this.getOrCreateLeaderboard(`Seasonal ${monthName}`, 'SEASONAL', periodStart, periodEnd);
            for (const result of results) {
                await this.updateLeaderboardEntry(seasonalLb.id, result.player.id, result.finishPosition, totalPlayers, result.points);
            }
        }
        // 4. Обновить рейтинг по ММР
        await this.updateRankMMRLeaderboard();
        console.log(`✅ Recalculated all ratings: ${tournaments.length} tournaments, ${updatedResults} results${createdMissing ? `, ${createdMissing} missing results created` : ''}`);
        return { updatedTournaments: tournaments.length, updatedResults, createdMissing };
    }
}
exports.LeaderboardService = LeaderboardService;
//# sourceMappingURL=LeaderboardService.js.map