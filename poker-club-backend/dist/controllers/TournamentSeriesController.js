"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentSeriesController = void 0;
const TournamentSeriesService_1 = require("../services/TournamentSeriesService");
const seriesService = new TournamentSeriesService_1.TournamentSeriesService();
class TournamentSeriesController {
    static async create(req, res) {
        try {
            const clubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : req.body.clubId;
            const { name, periodStart, periodEnd, daysOfWeek, defaultStartTime, defaultBuyIn, defaultStartingStack, defaultBlindStructureId, defaultAddonChips, defaultAddonCost, defaultRebuyChips, defaultRebuyCost, defaultMaxRebuys, defaultMaxAddons } = req.body;
            if (!name || !periodStart || !periodEnd) {
                return res.status(400).json({ error: 'name, periodStart, periodEnd are required' });
            }
            if (!clubId) {
                return res.status(400).json({ error: 'clubId is required' });
            }
            const series = await seriesService.createSeries({
                name,
                periodStart: new Date(periodStart),
                periodEnd: new Date(periodEnd),
                daysOfWeek: Array.isArray(daysOfWeek) ? daysOfWeek : undefined,
                clubId,
                defaultStartTime,
                defaultBuyIn,
                defaultStartingStack,
                defaultBlindStructureId,
                defaultAddonChips: defaultAddonChips ?? 0,
                defaultAddonCost: defaultAddonCost ?? 0,
                defaultRebuyChips: defaultRebuyChips ?? 0,
                defaultRebuyCost: defaultRebuyCost ?? 0,
                defaultMaxRebuys: defaultMaxRebuys ?? 0,
                defaultMaxAddons: defaultMaxAddons ?? 0,
            });
            res.status(201).json(series);
        }
        catch (e) {
            res.status(400).json({ error: e instanceof Error ? e.message : 'Failed' });
        }
    }
    static async getAll(req, res) {
        try {
            const clubFilter = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : req.query.clubId;
            const series = await seriesService.getAllSeries(clubFilter ?? undefined);
            res.json({ series });
        }
        catch (e) {
            res.status(400).json({ error: e instanceof Error ? e.message : 'Failed' });
        }
    }
    static async getById(req, res) {
        try {
            const id = req.params.id;
            const series = await seriesService.getSeriesById(id);
            res.json({
                ...series,
                daysOfWeek: seriesService.getDaysOfWeekArray(series),
            });
        }
        catch (e) {
            res.status(404).json({ error: e instanceof Error ? e.message : 'Not found' });
        }
    }
    static async update(req, res) {
        try {
            const id = req.params.id;
            const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
            const { name, periodStart, periodEnd, daysOfWeek } = req.body;
            const series = await seriesService.updateSeries(id, {
                name,
                periodStart: periodStart ? new Date(periodStart) : undefined,
                periodEnd: periodEnd ? new Date(periodEnd) : undefined,
                daysOfWeek: Array.isArray(daysOfWeek) ? daysOfWeek : undefined,
            }, managedClubId);
            res.json(series);
        }
        catch (e) {
            res.status(400).json({ error: e instanceof Error ? e.message : 'Failed' });
        }
    }
    static async delete(req, res) {
        try {
            const id = req.params.id;
            const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
            await seriesService.deleteSeries(id, managedClubId);
            res.json({ message: 'Series deleted' });
        }
        catch (e) {
            res.status(400).json({ error: e instanceof Error ? e.message : 'Failed' });
        }
    }
    /**
     * GET /tournament-series/:id/rating-table — Таблица рейтинга серии
     */
    static async getRatingTable(req, res) {
        try {
            const id = req.params.id;
            const limit = parseInt(req.query.limit) || 20;
            const table = await seriesService.getSeriesRatingTable(id, limit);
            res.json(table);
        }
        catch (e) {
            res.status(400).json({ error: e instanceof Error ? e.message : 'Failed' });
        }
    }
}
exports.TournamentSeriesController = TournamentSeriesController;
//# sourceMappingURL=TournamentSeriesController.js.map