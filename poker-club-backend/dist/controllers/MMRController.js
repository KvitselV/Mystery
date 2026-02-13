"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MMRController = void 0;
const MMRService_1 = require("../services/MMRService");
const mmrService = new MMRService_1.MMRService();
class MMRController {
    /**
     * GET /mmr/top - Получить топ игроков по ММР
     */
    static async getTopPlayers(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const players = await mmrService.getTopPlayersByMMR(limit);
            res.json({
                players: players.map((player) => ({
                    id: player.id,
                    name: `${player.user.firstName} ${player.user.lastName}`,
                    mmrValue: player.mmrValue,
                    rankCode: player.rankCode,
                })),
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
    * GET /mmr/rank/:rankCode - Получить игроков по рангу
    */
    static async getPlayersByRank(req, res) {
        try {
            const { rankCode } = req.params;
            // Проверка что rankCode это строка
            if (Array.isArray(rankCode)) {
                return res.status(400).json({ error: 'Invalid rank code format' });
            }
            if (!['E', 'D', 'C', 'B', 'A', 'S', 'SS'].includes(rankCode)) {
                return res.status(400).json({ error: 'Invalid rank code' });
            }
            const players = await mmrService.getPlayersByRank(rankCode);
            res.json({
                rankCode,
                players: players.map((player) => ({
                    id: player.id,
                    name: `${player.user.firstName} ${player.user.lastName}`,
                    mmrValue: player.mmrValue,
                    rankCode: player.rankCode,
                })),
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
    /**
     * POST /mmr/recalculate/:tournamentId - Пересчитать ММР для турнира
     * Только для администраторов
     */
    static async recalculateTournamentMMR(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const { tournamentId } = req.params;
            // Проверка что tournamentId это строка
            if (Array.isArray(tournamentId)) {
                return res.status(400).json({ error: 'Invalid tournament ID format' });
            }
            await mmrService.recalculateTournamentMMR(tournamentId);
            res.json({
                message: 'MMR recalculation completed',
                tournamentId,
            });
        }
        catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
}
exports.MMRController = MMRController;
//# sourceMappingURL=MMRController.js.map