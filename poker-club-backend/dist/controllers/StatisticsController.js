"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsController = void 0;
const StatisticsService_1 = require("../services/StatisticsService");
const statistics_1 = require("../services/statistics");
const database_1 = require("../config/database");
const PlayerProfile_1 = require("../models/PlayerProfile");
const statisticsService = StatisticsService_1.StatisticsService.getInstance();
const pokerStatisticsService = statistics_1.PokerStatisticsService.getInstance();
const profileRepo = database_1.AppDataSource.getRepository(PlayerProfile_1.PlayerProfile);
function canAccessUser(req, userId) {
    if (!req.user)
        return false;
    return req.user.userId === userId || req.user.role === 'ADMIN';
}
class StatisticsController {
    /**
     * GET /statistics/user/:userId — только свой профиль или ADMIN
     */
    static async getFullStatistics(req, res) {
        try {
            const userId = req.params.userId;
            if (!canAccessUser(req, userId)) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            const profile = await profileRepo.findOne({
                where: { user: { id: userId } },
                relations: ['user'],
            });
            if (!profile) {
                res.status(404).json({ error: 'Player profile not found' });
                return;
            }
            const stats = await statisticsService.getPlayerFullStatistics(profile.id);
            // Не возвращаем raw-сущности (profile, lastTournament) — они могут вызвать ошибки сериализации
            const { profile: _p, lastTournament: _t, ...serializable } = stats;
            res.json(serializable);
        }
        catch (error) {
            console.error('Error fetching full statistics:', error);
            res.status(500).json({ error: 'Failed to fetch full statistics' });
        }
    }
    /**
     * GET /statistics/user/:userId/finishes
     */
    static async getFinishStatistics(req, res) {
        try {
            const userId = req.params.userId;
            if (!canAccessUser(req, userId)) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            const profile = await profileRepo.findOne({
                where: { user: { id: userId } },
                relations: ['user'],
            });
            if (!profile) {
                res.status(404).json({ error: 'Player profile not found' });
                return;
            }
            const stats = await statisticsService.getFinishStatistics(profile.id);
            res.json(stats);
        }
        catch (error) {
            console.error('Error fetching finish statistics:', error);
            res.status(500).json({ error: 'Failed to fetch finish statistics' });
        }
    }
    /**
     * GET /statistics/user/:userId/participation
     */
    static async getParticipationChart(req, res) {
        try {
            const userId = req.params.userId;
            if (!canAccessUser(req, userId)) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            const profile = await profileRepo.findOne({
                where: { user: { id: userId } },
                relations: ['user'],
            });
            if (!profile) {
                res.status(404).json({ error: 'Player profile not found' });
                return;
            }
            const chart = await statisticsService.getParticipationChart(profile.id);
            res.json(chart);
        }
        catch (error) {
            console.error('Error fetching participation chart:', error);
            res.status(500).json({ error: 'Failed to fetch participation chart' });
        }
    }
    /**
     * GET /statistics/user/:userId/last-tournament
     */
    static async getLastTournament(req, res) {
        try {
            const userId = req.params.userId;
            if (!canAccessUser(req, userId)) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            const profile = await profileRepo.findOne({
                where: { user: { id: userId } },
                relations: ['user'],
            });
            if (!profile) {
                res.status(404).json({ error: 'Player profile not found' });
                return;
            }
            const tournament = await statisticsService.getLastTournament(profile.id);
            res.json(tournament);
        }
        catch (error) {
            console.error('Error fetching last tournament:', error);
            res.status(500).json({ error: 'Failed to fetch last tournament' });
        }
    }
    /**
     * POST /statistics/user/:userId/update — только ADMIN (requireRole в роуте)
     */
    static async updateStatistics(req, res) {
        try {
            const userId = req.params.userId;
            const { tournamentId } = req.body;
            if (!tournamentId) {
                res.status(400).json({ error: 'tournamentId is required' });
                return;
            }
            await statisticsService.updatePlayerStatistics(userId, tournamentId);
            res.json({ message: 'Statistics updated successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to update statistics' });
        }
    }
    /**
     * GET /statistics/profile/:playerProfileId — получить профиль по playerProfileId (доступно всем авторизованным)
     */
    static async getProfileByPlayerProfileId(req, res) {
        try {
            const playerProfileId = req.params.playerProfileId;
            const profile = await profileRepo.findOne({
                where: { id: playerProfileId },
                relations: ['user'],
            });
            if (!profile) {
                res.status(404).json({ error: 'Player profile not found' });
                return;
            }
            const stats = await statisticsService.getPlayerFullStatistics(profile.id);
            // Возвращаем только сериализуемые данные
            const { profile: _p, lastTournament: _t, ...serializable } = stats;
            res.json({
                ...serializable,
                user: {
                    id: profile.user.id,
                    name: profile.user.name,
                    clubCardNumber: profile.user.clubCardNumber,
                    avatarUrl: profile.user.avatarUrl,
                    createdAt: profile.user.createdAt,
                },
            });
        }
        catch (error) {
            console.error('Error fetching profile by playerProfileId:', error);
            res.status(500).json({ error: 'Failed to fetch profile' });
        }
    }
    /**
     * GET /statistics/player/:userId — статистика с фильтрами (from, to, metrics)
     */
    static async getPlayerStatisticsWithFilters(req, res) {
        try {
            const userId = req.params.userId;
            if (!canAccessUser(req, userId)) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }
            const fromStr = req.query.from;
            const toStr = req.query.to;
            const metricsStr = req.query.metrics;
            let timeRange;
            if (fromStr && toStr) {
                const from = new Date(fromStr);
                const to = new Date(toStr);
                if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
                    timeRange = { from, to };
                }
            }
            const requestedMetrics = metricsStr
                ? metricsStr.split(',').map((s) => s.trim()).filter(Boolean)
                : undefined;
            const result = await pokerStatisticsService.getPlayerStatistics(userId, timeRange, requestedMetrics);
            if (!result) {
                res.status(404).json({ error: 'Player profile not found' });
                return;
            }
            res.json(result);
        }
        catch (error) {
            console.error('Error fetching player statistics:', error);
            res.status(500).json({ error: 'Failed to fetch player statistics' });
        }
    }
    /**
     * POST /statistics/compare — сравнить статистику нескольких игроков
     */
    static async comparePlayerStatistics(req, res) {
        try {
            const { userIds, metrics } = req.body;
            if (!Array.isArray(userIds) || userIds.length === 0) {
                res.status(400).json({ error: 'userIds must be a non-empty array' });
                return;
            }
            const requestedMetrics = Array.isArray(metrics) && metrics.length > 0 ? metrics : undefined;
            const results = await pokerStatisticsService.comparePlayerStatistics(userIds, requestedMetrics);
            const obj = {};
            for (const [userId, result] of results) {
                obj[userId] = result;
            }
            res.json(obj);
        }
        catch (error) {
            console.error('Error comparing player statistics:', error);
            res.status(500).json({ error: 'Failed to compare player statistics' });
        }
    }
    /**
     * GET /statistics/user/:userId/public — получить профиль по userId (доступно всем авторизованным, для просмотра чужих профилей)
     */
    static async getPublicProfileByUserId(req, res) {
        try {
            const userId = req.params.userId;
            const profile = await profileRepo.findOne({
                where: { user: { id: userId } },
                relations: ['user'],
            });
            if (!profile) {
                res.status(404).json({ error: 'Player profile not found' });
                return;
            }
            const stats = await statisticsService.getPlayerFullStatistics(profile.id);
            // Возвращаем только сериализуемые данные
            const { profile: _p, lastTournament: _t, ...serializable } = stats;
            res.json({
                ...serializable,
                user: {
                    id: profile.user.id,
                    name: profile.user.name,
                    clubCardNumber: profile.user.clubCardNumber,
                    avatarUrl: profile.user.avatarUrl,
                    createdAt: profile.user.createdAt,
                },
            });
        }
        catch (error) {
            console.error('Error fetching public profile by userId:', error);
            res.status(500).json({ error: 'Failed to fetch profile' });
        }
    }
}
exports.StatisticsController = StatisticsController;
//# sourceMappingURL=StatisticsController.js.map