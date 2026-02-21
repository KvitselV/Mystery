"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardController = void 0;
const LeaderboardService_1 = require("../services/LeaderboardService");
const leaderboardService = new LeaderboardService_1.LeaderboardService();
class LeaderboardController {
    /**
     * GET /leaderboards - Получить все рейтинги
     */
    static async getAllLeaderboards(req, res) {
        try {
            const leaderboards = await leaderboardService.getAllLeaderboards();
            res.json({
                leaderboards: leaderboards.map((lb) => ({
                    id: lb.id,
                    name: lb.name,
                    type: lb.type,
                    periodStart: lb.periodStart,
                    periodEnd: lb.periodEnd,
                    seriesId: lb.seriesId,
                    createdAt: lb.createdAt,
                })),
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * GET /leaderboards/:id/entries - Получить записи рейтинга
     */
    static async getLeaderboardEntries(req, res) {
        try {
            const { id } = req.params;
            // Проверка что id это строка, а не массив
            if (Array.isArray(id)) {
                return res.status(400).json({ error: 'Invalid leaderboard ID' });
            }
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            const entries = await leaderboardService.getLeaderboardEntries(id, limit, offset);
            res.json({
                entries: entries.map((entry) => ({
                    id: entry.id,
                    rankPosition: entry.rankPosition,
                    playerName: entry.playerProfile.user.name,
                    userId: entry.playerProfile.user.id,
                    avatarUrl: entry.playerProfile.user.avatarUrl ?? undefined,
                    tournamentsCount: entry.tournamentsCount,
                    averageFinish: entry.averageFinish,
                    ratingPoints: entry.ratingPoints,
                    rankCode: entry.playerProfile.rankCode,
                })),
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * POST /leaderboards/seasonal/create - Создать сезонный рейтинг
     * Только для администраторов
     */
    static async createSeasonalLeaderboard(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const leaderboard = await leaderboardService.createSeasonalLeaderboard();
            res.json({
                message: 'Seasonal leaderboard created',
                leaderboard: {
                    id: leaderboard.id,
                    name: leaderboard.name,
                    type: leaderboard.type,
                    periodStart: leaderboard.periodStart,
                    periodEnd: leaderboard.periodEnd,
                },
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * POST /leaderboards/rank-mmr/update - Обновить рейтинг по ММР
     * Только для администраторов
     */
    static async updateRankMMRLeaderboard(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            await leaderboardService.updateRankMMRLeaderboard();
            res.json({
                message: 'Rank MMR leaderboard updated successfully',
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * GET /leaderboards/period-ratings - Рейтинг за период (неделя / месяц / год)
     */
    static async getPeriodRatings(req, res) {
        try {
            const period = req.query.period || 'week';
            const clubId = req.query.clubId || undefined;
            if (!['week', 'month', 'year'].includes(period)) {
                return res.status(400).json({ error: 'Invalid period. Use week, month or year' });
            }
            const entries = await leaderboardService.getPeriodRatings(period, clubId || null);
            res.json({ entries });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * GET /leaderboards/rank-mmr - Получить топ по рангам
     */
    static async getRankMMRLeaderboard(req, res) {
        try {
            const leaderboard = await leaderboardService.createRankMMRLeaderboard();
            const entries = await leaderboardService.getLeaderboardEntries(leaderboard.id, 100);
            res.json({
                leaderboard: {
                    id: leaderboard.id,
                    name: leaderboard.name,
                    type: leaderboard.type,
                },
                entries: entries.map((entry) => ({
                    rankPosition: entry.rankPosition,
                    playerName: entry.playerProfile.user.name,
                    userId: entry.playerProfile.user.id,
                    avatarUrl: entry.playerProfile.user.avatarUrl ?? undefined,
                    rankCode: entry.playerProfile.rankCode,
                    ratingPoints: entry.ratingPoints,
                    tournamentsCount: entry.tournamentsCount,
                })),
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
}
exports.LeaderboardController = LeaderboardController;
//# sourceMappingURL=LeaderboardController.js.map