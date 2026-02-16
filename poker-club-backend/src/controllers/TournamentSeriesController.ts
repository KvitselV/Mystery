import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { TournamentSeriesService } from '../services/TournamentSeriesService';

const seriesService = new TournamentSeriesService();

export class TournamentSeriesController {
  static async create(req: AuthRequest, res: Response) {
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
    } catch (e: unknown) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed' });
    }
  }

  static async getAll(req: AuthRequest, res: Response) {
    try {
      const clubFilter = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : (req.query.clubId as string | undefined);
      const series = await seriesService.getAllSeries(clubFilter ?? undefined);
      res.json({ series });
    } catch (e: unknown) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed' });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const series = await seriesService.getSeriesById(id);
      res.json({
        ...series,
        daysOfWeek: seriesService.getDaysOfWeekArray(series),
      });
    } catch (e: unknown) {
      res.status(404).json({ error: e instanceof Error ? e.message : 'Not found' });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
      const { name, periodStart, periodEnd, daysOfWeek } = req.body;
      const series = await seriesService.updateSeries(id, {
        name,
        periodStart: periodStart ? new Date(periodStart) : undefined,
        periodEnd: periodEnd ? new Date(periodEnd) : undefined,
        daysOfWeek: Array.isArray(daysOfWeek) ? daysOfWeek : undefined,
      }, managedClubId);
      res.json(series);
    } catch (e: unknown) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed' });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
      await seriesService.deleteSeries(id, managedClubId);
      res.json({ message: 'Series deleted' });
    } catch (e: unknown) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed' });
    }
  }

  /**
   * GET /tournament-series/:id/rating-table — Таблица рейтинга серии
   */
  static async getRatingTable(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const table = await seriesService.getSeriesRatingTable(id);
      res.json(table);
    } catch (e: unknown) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed' });
    }
  }
}
