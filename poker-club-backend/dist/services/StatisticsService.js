"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsService = void 0;
const database_1 = require("../config/database");
const PlayerProfile_1 = require("../models/PlayerProfile");
const TournamentResult_1 = require("../models/TournamentResult");
const Tournament_1 = require("../models/Tournament");
const TournamentRegistration_1 = require("../models/TournamentRegistration");
const statistics_1 = require("./statistics");
class StatisticsService {
    constructor() {
        this.profileRepo = database_1.AppDataSource.getRepository(PlayerProfile_1.PlayerProfile);
        this.resultRepo = database_1.AppDataSource.getRepository(TournamentResult_1.TournamentResult);
        this.tournamentRepo = database_1.AppDataSource.getRepository(Tournament_1.Tournament);
        this.registrationRepo = database_1.AppDataSource.getRepository(TournamentRegistration_1.TournamentRegistration);
        this.pokerStats = statistics_1.PokerStatisticsService.getInstance();
    }
    static getInstance() {
        if (!StatisticsService.instance) {
            StatisticsService.instance = new StatisticsService();
        }
        return StatisticsService.instance;
    }
    async updatePlayerStatistics(userId, tournamentId) {
        // Найти профиль по user_id через связь
        const profile = await this.profileRepo.findOne({
            where: { user: { id: userId } },
            relations: ['user'],
        });
        if (!profile) {
            console.warn(`Profile not found for user ${userId}`);
            return;
        }
        // Найти результат по player_id
        const result = await this.resultRepo
            .createQueryBuilder('result')
            .where('result.player_id = :playerId', { playerId: profile.id })
            .andWhere('result.tournament_id = :tournamentId', { tournamentId })
            .getOne();
        if (!result) {
            console.warn(`Result not found for player ${profile.id} in tournament ${tournamentId}`);
            return;
        }
        // 2. Обновить bestFinish
        if (!profile.bestFinish || result.finishPosition < profile.bestFinish) {
            profile.bestFinish = result.finishPosition;
        }
        // 3. Обновить любимый турнир (наиболее частый)
        profile.favoriteTournamentId = await this.getMostPlayedTournament(profile.id);
        // 4. Обновить streak (серия финишей в призах) — полный пересчёт по хронологии
        await this.recalculateStreak(profile);
        // 5. Обновить winRate (процент финальных столов = final table rate / ITM)
        profile.winRate = await this.calculateFinalTableRate(profile.id);
        // 6. Обновить averageFinish
        profile.averageFinish = await this.calculateAverageFinish(profile.id);
        await this.profileRepo.save(profile);
    }
    /**
     * Рассчитать процент финальных столов (ITM / final table rate).
     * Сохраняется в profile.winRate.
     */
    async calculateFinalTableRate(playerProfileId) {
        const results = await this.resultRepo
            .createQueryBuilder('result')
            .where('result.player_id = :playerId', { playerId: playerProfileId })
            .getMany();
        if (results.length === 0)
            return 0;
        const finalTableCount = results.filter((r) => r.isFinalTable).length;
        return parseFloat(((finalTableCount / results.length) * 100).toFixed(2));
    }
    /**
     * Рассчитать среднее место финиша
     */
    async calculateAverageFinish(playerProfileId) {
        const results = await this.resultRepo
            .createQueryBuilder('result')
            .where('result.player_id = :playerId', { playerId: playerProfileId })
            .getMany();
        if (results.length === 0)
            return 0;
        const totalFinish = results.reduce((sum, r) => sum + r.finishPosition, 0);
        return parseFloat((totalFinish / results.length).toFixed(2));
    }
    /**
     * Получить наиболее часто играемый турнир
     */
    async getMostPlayedTournament(playerProfileId) {
        const result = await this.resultRepo
            .createQueryBuilder('result')
            .select('result.tournament_id', 'tournamentId')
            .addSelect('COUNT(*)', 'count')
            .where('result.player_id = :playerId', { playerId: playerProfileId })
            .groupBy('result.tournament_id')
            .orderBy('count', 'DESC')
            .limit(1)
            .getRawOne();
        return result?.tournamentId;
    }
    /**
     * Пересчитать streak по всем результатам в хронологическом порядке.
     * «В призах» = финальный стол (isFinalTable).
     */
    async recalculateStreak(profile) {
        const results = await this.resultRepo
            .createQueryBuilder('result')
            .leftJoin('result.tournament', 'tournament')
            .where('result.player_id = :playerId', { playerId: profile.id })
            .orderBy('tournament.startTime', 'ASC')
            .getMany();
        let currentStreak = 0;
        let bestStreak = 0;
        for (const r of results) {
            if (r.isFinalTable) {
                currentStreak += 1;
                if (currentStreak > bestStreak)
                    bestStreak = currentStreak;
            }
            else {
                currentStreak = 0;
            }
        }
        profile.currentStreak = currentStreak;
        profile.bestStreak = bestStreak;
    }
    /**
     * Получить последние N выступлений (дата, место, всего участников)
     * @deprecated Специфичная логика; для универсальной статистики используйте PokerStatisticsService
     */
    async getLastPerformances(playerProfileId, limit = 7) {
        const results = await this.resultRepo
            .createQueryBuilder('result')
            .leftJoinAndSelect('result.tournament', 'tournament')
            .where('result.player_id = :playerId', { playerId: playerProfileId })
            .orderBy('tournament.startTime', 'DESC')
            .take(limit)
            .getMany();
        const tournamentIds = [...new Set(results.map((r) => r.tournament?.id).filter(Boolean))];
        let totalByTid = {};
        let maxPosByTid = {};
        if (tournamentIds.length > 0) {
            const registrationCounts = await this.registrationRepo
                .createQueryBuilder('r')
                .select('r.tournament_id', 'tid')
                .addSelect('COUNT(*)', 'cnt')
                .where('r.tournament_id IN (:...ids)', { ids: tournamentIds })
                .groupBy('r.tournament_id')
                .getRawMany();
            totalByTid = Object.fromEntries(registrationCounts.map((c) => [c.tid, parseInt(String(c.cnt), 10)]));
            try {
                const maxPositionRows = await this.resultRepo
                    .createQueryBuilder('result')
                    .select('result.tournament_id', 'tid')
                    .addSelect('MAX(result.finishPosition)', 'maxPos')
                    .where('result.tournament_id IN (:...ids)', { ids: tournamentIds })
                    .groupBy('result.tournament_id')
                    .getRawMany();
                maxPosByTid = Object.fromEntries(maxPositionRows.map((c) => [c.tid, parseInt(String(c.maxPos), 10)]));
            }
            catch (e) {
                console.warn('getLastPerformances: could not fetch max finishPosition per tournament', e);
            }
        }
        const resolveTotalPlayers = (tid, finishPosition) => totalByTid[tid] ?? maxPosByTid[tid] ?? finishPosition;
        return results
            .filter((r) => r.tournament?.startTime && r.tournament?.id)
            .map((r) => ({
            date: new Date(r.tournament.startTime).toISOString().slice(0, 10),
            place: r.finishPosition,
            totalPlayers: r.tournament.id
                ? resolveTotalPlayers(r.tournament.id, r.finishPosition)
                : r.finishPosition,
            tournamentId: r.tournament.id,
        }))
            .reverse(); // хронологический порядок для графика (от старых к новым)
    }
    /**
     * Победы в турнирах серий (1-е место, турнир с seriesId)
     * @deprecated Специфичная логика; для универсальной статистики используйте PokerStatisticsService
     */
    async getSeriesWins(playerProfileId) {
        const results = await this.resultRepo.find({
            where: { player: { id: playerProfileId }, finishPosition: 1 },
            relations: ['tournament', 'tournament.series'],
        });
        return results.filter((r) => r.tournament?.series != null).length;
    }
    /**
     * Получить полную статистику игрока (по playerProfileId)
     * @deprecated Используйте PokerStatisticsService + profile/lastTournament по необходимости
     */
    async getPlayerFullStatistics(playerProfileId) {
        const profile = await this.profileRepo.findOne({
            where: { id: playerProfileId },
            relations: ['user', 'balance'],
        });
        const empty = {
            profile: null,
            finishes: { first: 0, second: 0, third: 0, others: 0 },
            participationChart: [],
            lastTournament: null,
            tournamentsPlayed: 0,
            winPercentage: 0,
            itmRate: 0,
            averageFinish: 0,
            bestFinish: null,
            last7Performances: [],
            seriesWins: 0,
            bestStreak: 0,
        };
        if (!profile)
            return empty;
        const [finishes, participationChart, lastTournament, last7Performances, seriesWins] = await Promise.all([
            this.getFinishStatistics(playerProfileId),
            this.getParticipationChart(playerProfileId),
            this.getLastTournament(playerProfileId),
            this.getLastPerformances(playerProfileId, 7),
            this.getSeriesWins(playerProfileId),
        ]);
        const total = finishes.first + finishes.second + finishes.third + finishes.others;
        const winPercentage = total > 0 ? parseFloat(((finishes.first / total) * 100).toFixed(1)) : 0;
        return {
            profile,
            finishes,
            participationChart,
            lastTournament,
            tournamentsPlayed: total,
            winPercentage,
            itmRate: profile.winRate ?? 0,
            averageFinish: profile.averageFinish ?? 0,
            bestFinish: profile.bestFinish ?? null,
            last7Performances,
            seriesWins,
            bestStreak: profile.bestStreak ?? 0,
        };
    }
    /**
     * Получить статистику финишей игрока
     * @deprecated Используйте PokerStatisticsService.getPlayerStatisticsByProfileId с метриками wins, secondPlaces, thirdPlaces
     */
    async getFinishStatistics(playerProfileId) {
        const result = await this.pokerStats.getPlayerStatisticsByProfileId(playerProfileId, undefined, ['wins', 'secondPlaces', 'thirdPlaces', 'tournamentsPlayed']);
        const wins = result.metrics.wins ?? 0;
        const second = result.metrics.secondPlaces ?? 0;
        const third = result.metrics.thirdPlaces ?? 0;
        const total = result.metrics.tournamentsPlayed ?? 0;
        return {
            first: wins,
            second,
            third,
            others: total - wins - second - third,
        };
    }
    /**
     * Получить график участия (по месяцам)
     * @deprecated Используйте PokerStatisticsService.getPlayerStatisticsByProfileId с метрикой participationByMonth
     */
    async getParticipationChart(playerProfileId) {
        const result = await this.pokerStats.getPlayerStatisticsByProfileId(playerProfileId, undefined, ['participationByMonth']);
        const items = result.metrics.participationByMonth ?? [];
        return items.map(({ period, count }) => ({ month: period, count }));
    }
    /**
     * Получить последний сыгранный турнир
     * @deprecated Специфичная логика; для универсальной статистики используйте PokerStatisticsService
     */
    async getLastTournament(playerProfileId) {
        const result = await this.resultRepo
            .createQueryBuilder('result')
            .leftJoinAndSelect('result.tournament', 'tournament')
            .where('result.player_id = :playerId', { playerId: playerProfileId })
            .orderBy('tournament.startTime', 'DESC')
            .getOne();
        return result?.tournament ?? null;
    }
}
exports.StatisticsService = StatisticsService;
StatisticsService.instance = null;
//# sourceMappingURL=StatisticsService.js.map