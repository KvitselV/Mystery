"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentController = void 0;
const TournamentService_1 = require("../services/TournamentService");
const database_1 = require("../config/database");
const PlayerProfile_1 = require("../models/PlayerProfile");
const tournamentService = new TournamentService_1.TournamentService();
const playerProfileRepository = database_1.AppDataSource.getRepository(PlayerProfile_1.PlayerProfile);
class TournamentController {
    static async createTournament(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const { name, seriesId, clubId, startTime, buyInCost, startingStack, addonChips, rebuyChips, blindStructureId, rewards } = req.body;
            if (!name || !startTime || !buyInCost || !startingStack) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            const tournament = await tournamentService.createTournament({
                name,
                seriesId,
                clubId,
                startTime: new Date(startTime),
                buyInCost,
                startingStack,
                addonChips: addonChips ?? 0,
                rebuyChips: rebuyChips ?? 0,
                blindStructureId,
                rewards: Array.isArray(rewards) ? rewards : undefined,
            });
            res.status(201).json(tournament);
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * GET /tournaments - Получить список турниров
     */
    static async getTournaments(req, res) {
        try {
            const statusRaw = req.query.status;
            const seriesIdRaw = req.query.seriesId;
            const clubIdRaw = req.query.clubId;
            const limitRaw = req.query.limit;
            const offsetRaw = req.query.offset;
            const status = typeof statusRaw === 'string' ? statusRaw : undefined;
            const seriesId = typeof seriesIdRaw === 'string' ? seriesIdRaw : undefined;
            const clubId = typeof clubIdRaw === 'string' ? clubIdRaw : undefined;
            const limit = typeof limitRaw === 'string' ? parseInt(limitRaw) : 50;
            const offset = typeof offsetRaw === 'string' ? parseInt(offsetRaw) : 0;
            const { tournaments, total } = await tournamentService.getTournaments({
                status,
                seriesId,
                clubId,
                limit,
                offset,
            });
            res.json({ tournaments, total });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * GET /tournaments/:id - Получить турнир по ID
     */
    static async getTournamentById(req, res) {
        try {
            const tournamentIdRaw = req.params.id;
            const tournamentId = Array.isArray(tournamentIdRaw) ? tournamentIdRaw[0] : tournamentIdRaw;
            const tournament = await tournamentService.getTournamentById(tournamentId);
            res.json(tournament);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Not found';
            res.status(404).json({ error: message });
        }
    }
    /**
     * PATCH /tournaments/:id/rewards - Обновить награды турнира (ADMIN)
     */
    static async updateTournamentRewards(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const { rewards } = req.body;
            if (!Array.isArray(rewards)) {
                return res.status(400).json({ error: 'rewards must be an array of { rewardId, place }' });
            }
            await tournamentService.setTournamentRewards(id, rewards);
            const tournament = await tournamentService.getTournamentById(id);
            res.json(tournament);
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * POST /tournaments/:id/register - Зарегистрироваться на турнир
     */
    static async registerForTournament(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const tournamentIdRaw = req.params.id;
            const tournamentId = Array.isArray(tournamentIdRaw) ? tournamentIdRaw[0] : tournamentIdRaw;
            const { paymentMethod } = req.body;
            // Получи PlayerProfile по userId
            const playerProfile = await playerProfileRepository.findOne({
                where: { user: { id: req.user.userId } },
            });
            if (!playerProfile) {
                return res.status(404).json({ error: 'Player profile not found' });
            }
            const registration = await tournamentService.registerPlayer(tournamentId, playerProfile.id, paymentMethod || 'DEPOSIT');
            res.status(201).json(registration);
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * GET /tournaments/:id/players - Получить участников турнира
     */
    static async getTournamentPlayers(req, res) {
        try {
            const tournamentIdRaw = req.params.id;
            const tournamentId = Array.isArray(tournamentIdRaw) ? tournamentIdRaw[0] : tournamentIdRaw;
            const players = await tournamentService.getTournamentPlayers(tournamentId);
            res.json({
                players: players.map((p) => ({
                    id: p.id,
                    playerName: `${p.player.user.firstName} ${p.player.user.lastName}`,
                    registeredAt: p.registeredAt,
                    paymentMethod: p.paymentMethod,
                    isActive: p.isActive,
                })),
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * PATCH /tournaments/:id/status - Изменить статус турнира (только админ)
     */
    static async updateTournamentStatus(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const tournamentIdRaw = req.params.id;
            const tournamentId = Array.isArray(tournamentIdRaw) ? tournamentIdRaw[0] : tournamentIdRaw;
            const { status } = req.body;
            if (!status) {
                return res.status(400).json({ error: 'Status is required' });
            }
            const tournament = await tournamentService.updateTournamentStatus(tournamentId, status);
            res.json(tournament);
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
   * DELETE /tournaments/:id/register - Отменить регистрацию
   */
    static async unregisterFromTournament(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const tournamentId = req.params.id;
            await tournamentService.unregisterFromTournament(req.user.userId, tournamentId);
            res.json({
                message: 'Unregistered successfully',
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
}
exports.TournamentController = TournamentController;
//# sourceMappingURL=TournamentController.js.map