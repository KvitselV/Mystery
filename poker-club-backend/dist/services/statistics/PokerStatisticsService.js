"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PokerStatisticsService = exports.POKER_METRIC_NAMES = void 0;
const database_1 = require("../../config/database");
const TournamentResult_1 = require("../../models/TournamentResult");
const PlayerProfile_1 = require("../../models/PlayerProfile");
const UniversalStatisticsService_1 = require("./UniversalStatisticsService");
const BaseCalculators_1 = require("./calculators/BaseCalculators");
exports.POKER_METRIC_NAMES = [
    'tournamentsPlayed',
    'wins',
    'secondPlaces',
    'thirdPlaces',
    'averageFinish',
    'bestFinish',
    'finalTableRate',
    'winRate',
    'participationByMonth',
    'tournamentDistribution',
    'finalTableCount',
    'seriesWins',
];
function createPokerFetchData() {
    const resultRepo = database_1.AppDataSource.getRepository(TournamentResult_1.TournamentResult);
    return async (context) => {
        const qb = resultRepo
            .createQueryBuilder('result')
            .leftJoinAndSelect('result.tournament', 'tournament')
            .leftJoinAndSelect('tournament.series', 'series')
            .leftJoinAndSelect('result.player', 'player');
        const playerProfileId = context.entityId ?? context.filters?.playerProfileId;
        if (playerProfileId) {
            qb.andWhere('result.player_id = :playerProfileId', { playerProfileId });
        }
        if (context.timeRange) {
            qb.andWhere('tournament.startTime >= :from', { from: context.timeRange.from });
            qb.andWhere('tournament.startTime <= :to', { to: context.timeRange.to });
        }
        return qb.getMany();
    };
}
function createPokerCalculators() {
    return [
        (0, BaseCalculators_1.createCountCalculator)('tournamentsPlayed'),
        (0, BaseCalculators_1.createCountCalculator)('wins', (r) => r.finishPosition === 1),
        (0, BaseCalculators_1.createCountCalculator)('secondPlaces', (r) => r.finishPosition === 2),
        (0, BaseCalculators_1.createCountCalculator)('thirdPlaces', (r) => r.finishPosition === 3),
        (0, BaseCalculators_1.createAverageCalculator)('averageFinish', (r) => r.finishPosition),
        (0, BaseCalculators_1.createMinCalculator)('bestFinish', (r) => r.finishPosition),
        (0, BaseCalculators_1.createPercentageCalculator)('finalTableRate', (r) => r.isFinalTable),
        /** winRate = процент побед (1-е место). Для % финальных столов см. finalTableRate */
        (0, BaseCalculators_1.createPercentageCalculator)('winRate', (r) => r.finishPosition === 1),
        (0, BaseCalculators_1.createTimeSeriesCalculator)('participationByMonth', (r) => r.tournament?.startTime ?? null, 'month'),
        (0, BaseCalculators_1.createGroupByCalculator)('tournamentDistribution', (r) => r.tournament?.name ?? '(unknown)'),
        (0, BaseCalculators_1.createCountCalculator)('finalTableCount', (r) => r.isFinalTable),
        (0, BaseCalculators_1.createCountCalculator)('seriesWins', (r) => r.finishPosition === 1 && r.tournament?.series != null),
    ];
}
class PokerStatisticsService {
    static getInstance() {
        if (!PokerStatisticsService.instance) {
            PokerStatisticsService.instance = new PokerStatisticsService();
        }
        return PokerStatisticsService.instance;
    }
    constructor() {
        this.profileRepo = database_1.AppDataSource.getRepository(PlayerProfile_1.PlayerProfile);
        this.universalService = new UniversalStatisticsService_1.UniversalStatisticsService('TournamentResult', createPokerFetchData());
        this.universalService.registerCalculators(createPokerCalculators());
    }
    resolvePlayerProfileId(userId) {
        return this.profileRepo
            .findOne({
            where: { user: { id: userId } },
            select: ['id'],
        })
            .then((p) => p?.id ?? null);
    }
    /**
     * Получить статистику игрока по userId
     */
    async getPlayerStatistics(userId, timeRange, requestedMetrics) {
        const playerProfileId = await this.resolvePlayerProfileId(userId);
        if (!playerProfileId)
            return null;
        const context = {
            userId,
            entityId: playerProfileId,
            timeRange,
            filters: { playerProfileId },
        };
        return this.universalService.calculateStatistics(context, requestedMetrics);
    }
    /**
     * Получить статистику игрока по playerProfileId
     */
    async getPlayerStatisticsByProfileId(playerProfileId, timeRange, requestedMetrics) {
        const context = {
            entityId: playerProfileId,
            timeRange,
            filters: { playerProfileId },
        };
        return this.universalService.calculateStatistics(context, requestedMetrics);
    }
    /**
     * Сравнить статистику нескольких игроков
     */
    async comparePlayerStatistics(userIds, requestedMetrics) {
        const profileIds = await Promise.all(userIds.map((uid) => this.resolvePlayerProfileId(uid)));
        const results = new Map();
        for (let i = 0; i < userIds.length; i++) {
            const userId = userIds[i];
            const profileId = profileIds[i];
            if (!profileId) {
                results.set(userId, null);
                continue;
            }
            const context = {
                userId,
                entityId: profileId,
                filters: { playerProfileId: profileId },
            };
            const result = await this.universalService.calculateStatistics(context, requestedMetrics);
            results.set(userId, result);
        }
        return results;
    }
    getAvailableMetrics() {
        return this.universalService.getRegisteredMetrics();
    }
}
exports.PokerStatisticsService = PokerStatisticsService;
PokerStatisticsService.instance = null;
//# sourceMappingURL=PokerStatisticsService.js.map