"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsController = void 0;
const StatisticsService_1 = require("../services/StatisticsService");
const database_1 = require("../config/database");
const PlayerProfile_1 = require("../models/PlayerProfile");
const statisticsService = new StatisticsService_1.StatisticsService();
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
}
exports.StatisticsController = StatisticsController;
//# sourceMappingURL=StatisticsController.js.map